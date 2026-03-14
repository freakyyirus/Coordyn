"""
Negotiation Engine — orchestrates multi-agent negotiations,
tracks message history, and computes analytics.
"""

import asyncio
import time
from dataclasses import dataclass, field
from typing import List, Dict, Optional

from agents import create_negotiation_team, build_task_prompt
from config import SCENARIOS
from utils import (
    extract_price_from_message,
    parse_deal_result,
    calculate_utility,
    compute_pareto_efficiency,
)


@dataclass
class NegotiationMessage:
    round: int
    sender: str
    content: str
    timestamp: float
    price_mentioned: Optional[float] = None


@dataclass
class NegotiationResult:
    success: bool
    rejected: bool
    rounds: int
    duration: float
    messages: List[NegotiationMessage] = field(default_factory=list)
    final_price: Optional[float] = None
    deal_details: str = ""
    shipper_utility: float = 0.0
    carrier_utility: float = 0.0
    pareto_efficiency: float = 0.0
    price_trajectory: List[Dict] = field(default_factory=list)
    utility_trajectory: List[Dict] = field(default_factory=list)


class NegotiationEngine:
    """Orchestrates a multi-agent negotiation session."""

    def __init__(
        self,
        scenario_name: str = "Rush Delivery",
        strategy_name: str = "balanced",
        include_warehouse: bool = False,
        max_turns: int = 12,
    ):
        self.scenario_name = scenario_name
        self.strategy_name = strategy_name
        self.include_warehouse = include_warehouse
        self.max_turns = max_turns
        self.scenario = SCENARIOS[scenario_name]

    async def run(self) -> NegotiationResult:
        """Execute the negotiation and return structured results."""
        team, agent_names = create_negotiation_team(
            scenario_name=self.scenario_name,
            strategy_name=self.strategy_name,
            include_warehouse=self.include_warehouse,
            max_turns=self.max_turns,
        )

        task_prompt = build_task_prompt(self.scenario_name, self.include_warehouse)
        messages: List[NegotiationMessage] = []
        price_trajectory: List[Dict] = []
        utility_trajectory: List[Dict] = []
        round_num = 0
        start_time = time.time()
        last_shipper_price = None
        last_carrier_price = None

        # Run the negotiation via streaming
        stream = team.run_stream(task=task_prompt)
        async for event in stream:
            # Skip TaskResult (the final summary event)
            if not hasattr(event, "source") or not hasattr(event, "content"):
                continue

            content = event.content if isinstance(event.content, str) else str(event.content)
            sender = event.source if isinstance(event.source, str) else str(event.source)

            # Skip the initial "user" task message
            if sender.lower() == "user":
                continue

            round_num += 1
            price = extract_price_from_message(content)

            msg = NegotiationMessage(
                round=round_num,
                sender=sender,
                content=content,
                timestamp=time.time(),
                price_mentioned=price,
            )
            messages.append(msg)

            # Track price trajectory
            if price:
                if sender == "Shipper":
                    last_shipper_price = price
                elif sender == "Carrier":
                    last_carrier_price = price

                price_trajectory.append({
                    "round": round_num,
                    "agent": sender,
                    "price": price,
                })

            # Compute running utilities
            shipper_u = 0.0
            carrier_u = 0.0
            if last_shipper_price or last_carrier_price:
                ref_price = last_carrier_price or last_shipper_price or 0
                shipper_u = calculate_utility("shipper", ref_price, self.scenario)
                carrier_u = calculate_utility("carrier", ref_price, self.scenario)

            utility_trajectory.append({
                "round": round_num,
                "shipper": shipper_u,
                "carrier": carrier_u,
            })

        duration = time.time() - start_time

        # Parse final outcome
        final_price = None
        deal_details = ""
        success = False
        rejected = False

        if messages:
            last_content = messages[-1].content
            result = parse_deal_result(last_content)
            success = result["accepted"]
            rejected = result["rejected"]
            deal_details = result["details"]
            if result["price"]:
                final_price = result["price"]
            elif last_carrier_price:
                final_price = last_carrier_price

        # Final utilities
        shipper_util = 0.0
        carrier_util = 0.0
        pareto = 0.0
        if final_price:
            shipper_util = calculate_utility("shipper", final_price, self.scenario)
            carrier_util = calculate_utility("carrier", final_price, self.scenario)
            pareto = compute_pareto_efficiency(shipper_util, carrier_util)

        return NegotiationResult(
            success=success,
            rejected=rejected,
            rounds=round_num,
            duration=duration,
            messages=messages,
            final_price=final_price,
            deal_details=deal_details,
            shipper_utility=shipper_util,
            carrier_utility=carrier_util,
            pareto_efficiency=pareto,
            price_trajectory=price_trajectory,
            utility_trajectory=utility_trajectory,
        )


async def run_batch_simulations(
    scenario_name: str,
    strategies: List[str],
    runs_per_strategy: int = 3,
    include_warehouse: bool = False,
) -> List[Dict]:
    """Run multiple negotiations across strategies and return aggregate results."""
    results = []
    for strategy in strategies:
        strategy_results = []
        for i in range(runs_per_strategy):
            engine = NegotiationEngine(
                scenario_name=scenario_name,
                strategy_name=strategy,
                include_warehouse=include_warehouse,
                max_turns=12,
            )
            result = await engine.run()
            strategy_results.append(result)

        # Aggregate
        deal_count = sum(1 for r in strategy_results if r.success)
        avg_rounds = sum(r.rounds for r in strategy_results) / len(strategy_results)
        avg_price = 0
        prices = [r.final_price for r in strategy_results if r.final_price]
        if prices:
            avg_price = sum(prices) / len(prices)

        avg_pareto = sum(r.pareto_efficiency for r in strategy_results) / len(strategy_results)

        results.append({
            "strategy": strategy,
            "runs": runs_per_strategy,
            "deal_rate": f"{deal_count}/{runs_per_strategy}",
            "deal_pct": deal_count / runs_per_strategy * 100,
            "avg_rounds": round(avg_rounds, 1),
            "avg_price": round(avg_price, 0),
            "avg_pareto": round(avg_pareto, 1),
        })

    return results
