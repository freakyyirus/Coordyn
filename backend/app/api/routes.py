"""REST API routes for negotiations, analytics, and app info."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import DealStatus, Negotiation, get_db
from app.models.database import User
from app.models.schemas import (
    AppInfo,
    BatchRequest,
    BatchResponse,
    BatchStrategyResult,
    DealSummary,
    NegotiationRequest,
    NegotiationResponse,
    MessageOut,
    ScenarioInfo,
    StrategyInfo,
)
from app.services.agent_service import (
    SCENARIOS,
    STRATEGIES,
    AgentService,
    agent_service,
)
from app.config import settings
from app.api.auth import get_current_user
from app.services.blockchain_service import blockchain_service

router = APIRouter()
logger = logging.getLogger(__name__)


# ── App info (scenarios & strategies) ────────────────────────────────────────

@router.get("/info", response_model=AppInfo)
async def get_info():
    """Return available scenarios and strategies for the frontend."""
    scenarios = [
        ScenarioInfo(name=k, description=v["description"], shipper=v["shipper"], carrier=v["carrier"], warehouse=v["warehouse"])
        for k, v in SCENARIOS.items()
    ]
    strategies = [
        StrategyInfo(key=k, label=v["label"], description=v["description"])
        for k, v in STRATEGIES.items()
    ]
    return AppInfo(scenarios=scenarios, strategies=strategies)


# ── Single negotiation ───────────────────────────────────────────────────────

@router.post("/negotiate", response_model=NegotiationResponse)
async def start_negotiation(
    req: NegotiationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run a single negotiation and persist results."""
    try:
        session_id = str(uuid.uuid4())

        # Persist initial record
        neg = Negotiation(
            session_id=session_id,
            status=DealStatus.NEGOTIATING,
            scenario=req.scenario,
            strategy=req.strategy.value,
            context=SCENARIOS.get(req.scenario, {}),
        )
        db.add(neg)
        db.commit()

        # Run negotiation
        result = await asyncio.wait_for(
            agent_service.run(
                scenario_name=req.scenario,
                strategy_name=req.strategy.value,
                include_warehouse=req.include_warehouse,
                max_turns=req.max_turns,
                custom_agents=[agent.model_dump() for agent in req.custom_agents],
            ),
            timeout=settings.NEGOTIATION_TIMEOUT,
        )

        # Update DB
        neg.status = DealStatus.ACCEPTED if result.success else (DealStatus.REJECTED if result.rejected else DealStatus.EXPIRED)
        neg.completed_at = datetime.now(timezone.utc)
        neg.transcript = [
            {"round": m.round, "sender": m.sender, "content": m.content, "price": m.price_mentioned, "ts": m.timestamp}
            for m in result.messages
        ]
        neg.metrics = {
            "rounds": result.rounds,
            "duration": result.duration,
            "shipper_utility": result.shipper_utility,
            "carrier_utility": result.carrier_utility,
            "pareto_efficiency": result.pareto_efficiency,
        }
        if result.final_price:
            neg.final_terms = {"price": result.final_price, "details": result.deal_details}

        # Blockchain mock
        tx = None
        if result.success and result.final_price:
            tx = await blockchain_service.log_deal(neg.final_terms)
            neg.blockchain_tx = tx

        db.commit()

        return NegotiationResponse(
            session_id=session_id,
            status=neg.status.value,
            rounds=result.rounds,
            duration=round(result.duration, 2),
            final_price=result.final_price,
            deal_details=result.deal_details,
            shipper_utility=round(result.shipper_utility, 3),
            carrier_utility=round(result.carrier_utility, 3),
            pareto_efficiency=round(result.pareto_efficiency, 1),
            transcript=[
                MessageOut(
                    round=m.round, sender=m.sender, content=m.content,
                    reasoning=m.reasoning, price_mentioned=m.price_mentioned,
                    timestamp=m.timestamp, utility=m.utility,
                )
                for m in result.messages
            ],
            price_trajectory=result.price_trajectory,
            utility_trajectory=result.utility_trajectory,
            blockchain_tx=tx,
            random_allocation_price=result.random_allocation_price,
            no_negotiation_price=result.no_negotiation_price,
        )
    except ValueError as exc:
        db.rollback()
        logger.warning("Invalid negotiation request: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except asyncio.TimeoutError as exc:
        db.rollback()
        logger.warning("Negotiation timed out after %s seconds", settings.NEGOTIATION_TIMEOUT)
        raise HTTPException(status_code=504, detail="Negotiation timed out") from exc
    except Exception as exc:
        db.rollback()
        logger.exception("Negotiation request failed")
        raise HTTPException(status_code=500, detail="Negotiation failed") from exc


# ── Batch comparison ─────────────────────────────────────────────────────────

@router.post("/negotiate/batch", response_model=BatchResponse)
async def batch_compare(req: BatchRequest, current_user: User = Depends(get_current_user)):
    """Run negotiations across all strategies and compare."""
    try:
        results: List[BatchStrategyResult] = []

        for strat_key, strat_info in STRATEGIES.items():
            strategy_runs = []
            for _ in range(req.runs_per_strategy):
                r = await asyncio.wait_for(
                    agent_service.run(
                        scenario_name=req.scenario,
                        strategy_name=strat_key,
                        include_warehouse=req.include_warehouse,
                    ),
                    timeout=settings.NEGOTIATION_TIMEOUT,
                )
                strategy_runs.append(r)

            deals = sum(1 for r in strategy_runs if r.success)
            prices = [r.final_price for r in strategy_runs if r.final_price]
            avg_price = sum(prices) / len(prices) if prices else 0
            avg_rounds = sum(r.rounds for r in strategy_runs) / len(strategy_runs)
            avg_pareto = sum(r.pareto_efficiency for r in strategy_runs) / len(strategy_runs)

            results.append(BatchStrategyResult(
                strategy=strat_key,
                label=strat_info["label"],
                runs=req.runs_per_strategy,
                deal_rate=f"{deals}/{req.runs_per_strategy}",
                deal_pct=round(deals / req.runs_per_strategy * 100, 1),
                avg_rounds=round(avg_rounds, 1),
                avg_price=round(avg_price),
                avg_pareto=round(avg_pareto, 1),
            ))

        return BatchResponse(scenario=req.scenario, results=results)
    except ValueError as exc:
        logger.warning("Invalid batch request: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except asyncio.TimeoutError as exc:
        logger.warning("Batch negotiation timed out")
        raise HTTPException(status_code=504, detail="Batch negotiation timed out") from exc
    except Exception as exc:
        logger.exception("Batch comparison failed")
        raise HTTPException(status_code=500, detail="Batch comparison failed") from exc


# ── Deal history ─────────────────────────────────────────────────────────────

@router.get("/deals", response_model=List[DealSummary])
async def get_deals(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.query(Negotiation).order_by(Negotiation.created_at.desc()).limit(limit).all()
    out = []
    for d in rows:
        price = None
        rounds = None
        if d.final_terms and isinstance(d.final_terms, dict):
            price = d.final_terms.get("price")
        if d.metrics and isinstance(d.metrics, dict):
            rounds = d.metrics.get("rounds")
        out.append(DealSummary(
            session_id=d.session_id,
            status=d.status.value if d.status else "unknown",
            scenario=d.scenario or "",
            strategy=d.strategy or "",
            final_price=price,
            rounds=rounds,
            created_at=d.created_at.isoformat() if d.created_at else None,
        ))
    return out


# ── Blockchain ledger ────────────────────────────────────────────────────────

@router.get("/blockchain/ledger")
async def get_ledger(current_user: User = Depends(get_current_user)):
    return blockchain_service.get_ledger()
