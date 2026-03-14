"""API routes for pulling external real-world context data."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import get_current_user
from app.models.database import User
from app.services.market_data_service import market_data_service

router = APIRouter(prefix="/market-data", tags=["market-data"])


@router.get("/context")
async def get_market_context(current_user: User = Depends(get_current_user)):
    try:
        return await market_data_service.build_negotiation_context()
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to fetch external market data") from exc
