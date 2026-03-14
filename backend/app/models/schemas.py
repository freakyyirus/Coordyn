"""Pydantic request / response schemas."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

from app.services.agent_service import SCENARIOS


# ── Enums ────────────────────────────────────────────────────────────────────


class StrategyType(str, Enum):
    COOPERATIVE = "cooperative"
    COMPETITIVE = "competitive"
    BALANCED = "balanced"


# ── Request models ───────────────────────────────────────────────────────────


class NegotiationRequest(BaseModel):
    scenario: str = "Rush Delivery"
    strategy: StrategyType = StrategyType.BALANCED
    include_warehouse: bool = False
    max_turns: int = Field(default=12, ge=4, le=20)
    custom_agents: List["CustomAgentConfig"] = Field(default_factory=list)

    @field_validator("scenario")
    @classmethod
    def validate_scenario(cls, value: str) -> str:
        if value not in SCENARIOS:
            raise ValueError(f"Unknown scenario: {value}")
        return value


class BatchRequest(BaseModel):
    scenario: str = "Rush Delivery"
    include_warehouse: bool = False
    runs_per_strategy: int = Field(default=2, ge=1, le=5)

    @field_validator("scenario")
    @classmethod
    def validate_scenario(cls, value: str) -> str:
        if value not in SCENARIOS:
            raise ValueError(f"Unknown scenario: {value}")
        return value


# ── Shared models ────────────────────────────────────────────────────────────


class Proposal(BaseModel):
    price: float = Field(..., ge=0)
    delivery_time: str = ""
    capacity: int = Field(default=0, ge=0)
    conditions: List[str] = Field(default_factory=list)


class CustomAgentConfig(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    role: str = Field(min_length=2, max_length=80)
    objective: str = Field(min_length=2, max_length=300)
    constraints: str = Field(default="None", max_length=400)
    strategy: Optional[str] = Field(default=None, max_length=32)


class MessageOut(BaseModel):
    round: int
    sender: str
    content: str
    reasoning: Optional[str] = None
    price_mentioned: Optional[float] = None
    timestamp: float = 0.0
    utility: Optional[float] = None


# ── Response models ──────────────────────────────────────────────────────────


class NegotiationResponse(BaseModel):
    session_id: str
    status: str
    rounds: int
    duration: float
    final_price: Optional[float] = None
    deal_details: str = ""
    shipper_utility: float = 0.0
    carrier_utility: float = 0.0
    pareto_efficiency: float = 0.0
    transcript: List[MessageOut] = Field(default_factory=list)
    price_trajectory: List[Dict[str, Any]] = Field(default_factory=list)
    utility_trajectory: List[Dict[str, Any]] = Field(default_factory=list)
    blockchain_tx: Optional[str] = None
    # Baseline comparisons
    random_allocation_price: Optional[float] = None
    no_negotiation_price: Optional[float] = None


class BatchStrategyResult(BaseModel):
    strategy: str
    label: str
    runs: int
    deal_rate: str
    deal_pct: float
    avg_rounds: float
    avg_price: float
    avg_pareto: float


class BatchResponse(BaseModel):
    scenario: str
    results: List[BatchStrategyResult]


class DealSummary(BaseModel):
    session_id: str
    status: str
    scenario: str
    strategy: str
    final_price: Optional[float] = None
    rounds: Optional[int] = None
    created_at: Optional[str] = None


class ScenarioInfo(BaseModel):
    name: str
    description: str
    shipper: Dict[str, Any]
    carrier: Dict[str, Any]
    warehouse: Dict[str, Any]


class StrategyInfo(BaseModel):
    key: str
    label: str
    description: str


class AppInfo(BaseModel):
    scenarios: List[ScenarioInfo]
    strategies: List[StrategyInfo]


class SignUpRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    company: Optional[str] = Field(default=None, max_length=120)
    use_case: Optional[str] = Field(default=None, max_length=64)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    company: Optional[str] = None
    use_case: Optional[str] = None
    role: str = "user"
    is_active: bool = True
