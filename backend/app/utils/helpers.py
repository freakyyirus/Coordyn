"""
Utility helpers — price extraction, utility scoring, parsing.
Ported from the original utils.py with minor tweaks.
"""

import re
from typing import Optional


def extract_price_from_message(message: str) -> Optional[float]:
    """Extract the first dollar amount mentioned in a message."""
    patterns = [
        r"\$\s*([\d,]+(?:\.\d{2})?)",
        r"([\d,]+(?:\.\d{2})?)\s*dollars",
        r"price[:\s]+\$?([\d,]+)",
        r"offer[:\s]+\$?([\d,]+)",
        r"quote[:\s]+\$?([\d,]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            price_str = match.group(1).replace(",", "")
            try:
                val = float(price_str)
                if 100 <= val <= 100_000:
                    return val
            except ValueError:
                continue
    return None


def calculate_utility(agent_type: str, price: float, scenario: dict) -> float:
    """Satisfaction score between 0 and 1."""
    if agent_type == "shipper":
        max_budget = scenario["shipper"]["max_budget"]
        if price > max_budget:
            return 0.0
        return max(0.0, 1.0 - 0.8 * (price / max_budget))
    elif agent_type == "carrier":
        min_price = scenario["carrier"]["min_price"]
        ideal_price = scenario["carrier"]["ideal_price"]
        if price < min_price:
            return 0.0
        if price >= ideal_price:
            return 1.0
        return (price - min_price) / (ideal_price - min_price)
    return 0.5


def compute_pareto_efficiency(u1: float, u2: float) -> float:
    return min(100.0, ((u1 + u2) / 1.4) * 100)


def parse_deal_result(message: str) -> dict:
    result = {"accepted": False, "rejected": False, "price": None, "details": ""}
    if "DEAL_ACCEPTED" in message:
        result["accepted"] = True
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


def format_duration(seconds: float) -> str:
    if seconds < 60:
        return f"{seconds:.1f}s"
    return f"{int(seconds // 60)}m {seconds % 60:.0f}s"
