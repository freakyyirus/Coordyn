"""
Utility functions for the Multi-Agent Negotiation System.
Scoring, message parsing, and analytics helpers.
"""

import re
import time
from typing import Optional


def calculate_utility(agent_type: str, price: float, scenario: dict) -> float:
    """
    Calculate the utility (satisfaction) score for an agent given a deal price.
    Returns a value between 0.0 and 1.0.
    """
    if agent_type == "shipper":
        max_budget = scenario["shipper"]["max_budget"]
        # Lower price → higher utility for shipper
        if price > max_budget:
            return 0.0
        # Scale: paying 0 = 1.0, paying max_budget = 0.2
        return max(0.0, 1.0 - 0.8 * (price / max_budget))

    elif agent_type == "carrier":
        min_price = scenario["carrier"]["min_price"]
        ideal_price = scenario["carrier"]["ideal_price"]
        # Higher price → higher utility for carrier
        if price < min_price:
            return 0.0
        if price >= ideal_price:
            return 1.0
        return (price - min_price) / (ideal_price - min_price)

    elif agent_type == "warehouse":
        rate = scenario["warehouse"]["rate_per_hour"]
        min_rate = rate * 0.7
        # Higher rate → higher utility
        if price < min_rate:
            return 0.0
        return min(1.0, (price - min_rate) / (rate - min_rate))

    return 0.5


def extract_price_from_message(message: str) -> Optional[float]:
    """Extract the first dollar amount mentioned in a message."""
    patterns = [
        r'\$\s*([\d,]+(?:\.\d{2})?)',          # $5,000 or $5000.00
        r'([\d,]+(?:\.\d{2})?)\s*dollars',      # 5000 dollars
        r'price[:\s]+\$?([\d,]+)',              # price: 5000
        r'offer[:\s]+\$?([\d,]+)',              # offer: 5000
        r'quote[:\s]+\$?([\d,]+)',              # quote: 5000
        r'([\d,]+)\s*(?:per|for the)',          # 5000 for the
    ]
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            price_str = match.group(1).replace(',', '')
            try:
                val = float(price_str)
                # Sanity check: prices should be reasonable
                if 100 <= val <= 100000:
                    return val
            except ValueError:
                continue
    return None


def parse_deal_result(message: str) -> dict:
    """Parse a DEAL_ACCEPTED or DEAL_REJECTED message."""
    result = {
        "accepted": False,
        "rejected": False,
        "price": None,
        "delivery_time": None,
        "details": "",
    }

    if "DEAL_ACCEPTED" in message:
        result["accepted"] = True
        # Try to extract terms after the colon
        parts = message.split("DEAL_ACCEPTED")
        if len(parts) > 1:
            result["details"] = parts[1].strip().lstrip(":")
            result["price"] = extract_price_from_message(parts[1])
    elif "DEAL_REJECTED" in message:
        result["rejected"] = True
        parts = message.split("DEAL_REJECTED")
        if len(parts) > 1:
            result["details"] = parts[1].strip().lstrip(":")

    return result


def compute_pareto_efficiency(shipper_util: float, carrier_util: float) -> float:
    """
    Compute a simplified Pareto efficiency score.
    Perfect Pareto: both utilities sum to max possible.
    Returns percentage (0-100).
    """
    total = shipper_util + carrier_util
    # Max possible is 2.0 (both at 1.0), but realistic max is ~1.4
    return min(100.0, (total / 1.4) * 100)


def format_duration(seconds: float) -> str:
    """Format seconds into a human-readable string."""
    if seconds < 60:
        return f"{seconds:.1f}s"
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes}m {secs:.0f}s"


def get_agent_emoji(agent_name: str) -> str:
    """Return an emoji for each agent type."""
    emojis = {
        "Shipper": "📦",
        "Carrier": "🚚",
        "Warehouse": "🏭",
        "Mediator": "🧑‍⚖️",
    }
    return emojis.get(agent_name, "🤖")


def get_agent_color(agent_name: str) -> str:
    """Return a hex color for each agent type."""
    colors = {
        "Shipper": "#6C63FF",
        "Carrier": "#FF6B6B",
        "Warehouse": "#4ECDC4",
        "Mediator": "#FFE66D",
    }
    return colors.get(agent_name, "#FFFFFF")
