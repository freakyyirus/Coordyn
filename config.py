"""
Configuration module for the Multi-Agent Negotiation System.
Handles API keys, model clients, and global settings.
"""

import os
from autogen_ext.models.openai import OpenAIChatCompletionClient


def get_model_client(model: str = "gpt-4o-mini", temperature: float = 0.7):
    """Create and return an OpenAI model client."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY environment variable not set. "
            "Set it with: $env:OPENAI_API_KEY='sk-...'"
        )
    return OpenAIChatCompletionClient(
        model=model,
        api_key=api_key,
        temperature=temperature,
    )


# ── Default Scenarios ────────────────────────────────────────────────────────

SCENARIOS = {
    "Rush Delivery": {
        "description": "⚡ High-pressure overnight delivery with tight deadlines",
        "shipper": {
            "cargo": "100 tons of electronics",
            "origin": "New York City",
            "destination": "Chicago",
            "deadline": "5 PM tomorrow",
            "max_budget": 5000,
            "priority": "speed",
        },
        "carrier": {
            "trucks": 2,
            "capacity_per_truck": 50,
            "min_price": 4000,
            "ideal_price": 5500,
            "earliest_delivery": "3 PM tomorrow",
            "fuel_surcharge": 0.15,
        },
        "warehouse": {
            "available_bays": 3,
            "rate_per_hour": 120,
            "min_hours": 4,
            "max_storage": 80,
            "location": "Chicago Southside",
        },
    },
    "Bulk Discount": {
        "description": "📦 Large volume shipment with room for negotiation",
        "shipper": {
            "cargo": "300 tons of raw materials",
            "origin": "Houston",
            "destination": "Detroit",
            "deadline": "End of week",
            "max_budget": 12000,
            "priority": "cost",
        },
        "carrier": {
            "trucks": 5,
            "capacity_per_truck": 60,
            "min_price": 8000,
            "ideal_price": 14000,
            "earliest_delivery": "3 days",
            "fuel_surcharge": 0.10,
        },
        "warehouse": {
            "available_bays": 6,
            "rate_per_hour": 90,
            "min_hours": 8,
            "max_storage": 250,
            "location": "Detroit Industrial Zone",
        },
    },
    "Last Minute": {
        "description": "🚨 Desperate same-day delivery — everything is urgent",
        "shipper": {
            "cargo": "40 tons of medical supplies",
            "origin": "Los Angeles",
            "destination": "San Francisco",
            "deadline": "Tonight 10 PM",
            "max_budget": 8000,
            "priority": "reliability",
        },
        "carrier": {
            "trucks": 1,
            "capacity_per_truck": 45,
            "min_price": 5000,
            "ideal_price": 9000,
            "earliest_delivery": "8 PM today",
            "fuel_surcharge": 0.25,
        },
        "warehouse": {
            "available_bays": 1,
            "rate_per_hour": 200,
            "min_hours": 2,
            "max_storage": 50,
            "location": "SF Bay Dockside",
        },
    },
}

# ── Strategy Definitions ─────────────────────────────────────────────────────

STRATEGIES = {
    "cooperative": {
        "label": "🤝 Cooperative",
        "description": "Agents seek win-win outcomes, share information freely",
        "tone": "friendly and transparent",
        "concession_rate": "willing to concede quickly for mutual benefit",
    },
    "competitive": {
        "label": "⚔️ Competitive",
        "description": "Agents aggressively pursue their own interests",
        "tone": "firm, strategic, and assertive",
        "concession_rate": "reluctant to concede, holds position strongly",
    },
    "balanced": {
        "label": "⚖️ Balanced",
        "description": "Mix of competitive opening with cooperative closing",
        "tone": "professional and pragmatic",
        "concession_rate": "moderate concessions based on reciprocity",
    },
}
