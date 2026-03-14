"""
Agent service — AutoGen integration.
Creates negotiation agent teams and runs conversations.
"""

from __future__ import annotations

import asyncio
import random
import re
import time
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator, Dict, List, Optional

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import TextMentionTermination
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.models.openai import OpenAIChatCompletionClient

from app.config import settings
from app.utils.helpers import (
    calculate_utility,
    compute_pareto_efficiency,
    extract_price_from_message,
    parse_deal_result,
)

MOCK_MODE = False

# ── Scenario & strategy data ────────────────────────────────────────────────

SCENARIOS: Dict[str, Dict] = {
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

STRATEGIES: Dict[str, Dict] = {
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


# ── Prompt builders ──────────────────────────────────────────────────────────


def _shipper_prompt(sc: dict, st: dict) -> str:
    s = sc["shipper"]
    return (
        f"You are a logistics **Shipper** negotiating a shipping contract.\n\n"
        f"YOUR SITUATION:\n"
        f"- Move {s['cargo']} from {s['origin']} to {s['destination']}.\n"
        f"- Deadline: {s['deadline']}.  Max budget: ${s['max_budget']:,}.  Priority: {s['priority']}.\n\n"
        f"STYLE: {st['tone']}.  {st['concession_rate']}.\n\n"
        f"RESPONSE FORMAT — every message MUST begin with a [THINKING] block:\n"
        f"[THINKING] your private strategic reasoning here — analyze opponents, plan next move [/THINKING]\n"
        f"Then your public negotiation message.\n\n"
        f"RULES:\n"
        f"1. 2-3 sentences max in your PUBLIC message (after [/THINKING]).\n"
        f"2. Always state specific dollar amounts.\n"
        f"3. Never accept above ${s['max_budget']:,}.\n"
        f"4. End with exactly: DEAL_ACCEPTED: [price], [time], [tons]  OR  DEAL_REJECTED: [reason]\n"
        f"5. Start by stating your needs and asking for a quote."
    )


def _carrier_prompt(sc: dict, st: dict) -> str:
    c = sc["carrier"]
    return (
        f"You are a trucking **Carrier** negotiating a shipping contract.\n\n"
        f"YOUR SITUATION:\n"
        f"- {c['trucks']} trucks ({c['capacity_per_truck']}t each). Min price: ${c['min_price']:,}. "
        f"Ideal: ${c['ideal_price']:,}. Earliest delivery: {c['earliest_delivery']}. "
        f"Fuel surcharge: {c['fuel_surcharge']:.0%}.\n\n"
        f"STYLE: {st['tone']}.  {st['concession_rate']}.\n\n"
        f"RESPONSE FORMAT — every message MUST begin with a [THINKING] block:\n"
        f"[THINKING] your private strategic reasoning here — analyze opponents, plan next move [/THINKING]\n"
        f"Then your public negotiation message.\n\n"
        f"RULES:\n"
        f"1. 2-3 sentences max in your PUBLIC message (after [/THINKING]).\n"
        f"2. Always state specific dollar amounts.\n"
        f"3. Start near ideal price, concede slowly.\n"
        f"4. Never accept below ${c['min_price']:,}.\n"
        f"5. End with exactly: DEAL_ACCEPTED: [price], [time], [tons]  OR  DEAL_REJECTED: [reason]"
    )


def _warehouse_prompt(sc: dict, st: dict) -> str:
    w = sc["warehouse"]
    return (
        f"You are a **Warehouse Manager** at {w['location']}.\n\n"
        f"SITUATION: {w['available_bays']} bays, ${w['rate_per_hour']}/hr, "
        f"min {w['min_hours']}h, max {w['max_storage']}t.\n\n"
        f"STYLE: {st['tone']}.  {st['concession_rate']}.\n\n"
        f"RESPONSE FORMAT — every message MUST begin with a [THINKING] block:\n"
        f"[THINKING] your private strategic reasoning here [/THINKING]\n"
        f"Then your public negotiation message.\n\n"
        f"RULES:\n"
        f"1. 2-3 sentences max in your PUBLIC message.\n"
        f"2. Quote specific rates.\n"
        f"3. Never below ${w['rate_per_hour'] * 0.7:.0f}/hr.\n"
        f"4. End with: DEAL_ACCEPTED: [rate], [hours], [bays], [total]  OR  DEAL_REJECTED: [reason]"
    )


def _custom_agent_prompt(agent: dict, sc: dict, st: dict) -> str:
    shipper = sc["shipper"]
    carrier = sc["carrier"]
    lane_summary = (
        f"Lane: {shipper['origin']} to {shipper['destination']}. "
        f"Cargo: {shipper['cargo']}. Deadline: {shipper['deadline']}. "
        f"Budget ceiling: ${shipper['max_budget']:,}. Carrier floor: ${carrier['min_price']:,}."
    )
    return (
        f"You are {agent['name']}, a logistics **{agent['role']}** in a multi-agent freight negotiation.\n\n"
        f"MARKET CONTEXT:\n"
        f"- {lane_summary}\n"
        f"- Your objective: {agent['objective']}\n"
        f"- Your operating constraints: {agent.get('constraints') or 'None'}\n\n"
        f"STYLE: {st['tone']}. {st['concession_rate']}.\n\n"
        f"RESPONSE FORMAT — every message MUST begin with a [THINKING] block:\n"
        f"[THINKING] your private logistics reasoning here — assess lane risk, capacity, margin, and timing [/THINKING]\n"
        f"Then your public negotiation message.\n\n"
        f"RULES:\n"
        f"1. Keep the PUBLIC message to 2-3 sentences.\n"
        f"2. Use logistics language: lane, load, dock, capacity, delivery window, margin.\n"
        f"3. Quote concrete numbers whenever pricing, capacity, or timing changes.\n"
        f"4. Protect your own objective while still trying to move the deal forward.\n"
        f"5. End with exactly: DEAL_ACCEPTED: [terms] OR DEAL_REJECTED: [reason] once you are ready to finalize."
    )


# ── Data structures ──────────────────────────────────────────────────────────

# ── Reasoning extraction ─────────────────────────────────────────────────────

_THINKING_RE = re.compile(r"\[THINKING\]\s*(.*?)\s*\[/THINKING\]", re.DOTALL)


def _split_reasoning(content: str):
    """Extract [THINKING]...[/THINKING] from message, return (reasoning, public_msg)."""
    m = _THINKING_RE.search(content)
    if m:
        reasoning = m.group(1).strip()
        public = content[: m.start()] + content[m.end() :]
        return reasoning, public.strip()
    return None, content


@dataclass
class NegMessage:
    round: int
    sender: str
    content: str
    timestamp: float
    price_mentioned: Optional[float] = None
    reasoning: Optional[str] = None
    utility: Optional[float] = None


@dataclass
class NegResult:
    success: bool = False
    rejected: bool = False
    rounds: int = 0
    duration: float = 0.0
    messages: List[NegMessage] = field(default_factory=list)
    final_price: Optional[float] = None
    deal_details: str = ""
    shipper_utility: float = 0.0
    carrier_utility: float = 0.0
    pareto_efficiency: float = 0.0
    price_trajectory: List[Dict] = field(default_factory=list)
    utility_trajectory: List[Dict] = field(default_factory=list)
    random_allocation_price: Optional[float] = None
    no_negotiation_price: Optional[float] = None


# ── Agent service ────────────────────────────────────────────────────────────


class AgentService:
    """Creates AutoGen teams and runs negotiations."""

    def _get_model_client(self) -> OpenAIChatCompletionClient:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set")
        return OpenAIChatCompletionClient(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.7,
        )

    def _build_team(
        self,
        scenario_name: str,
        strategy_name: str,
        include_warehouse: bool,
        max_turns: int,
        custom_agents: Optional[List[Dict[str, Any]]] = None,
    ):
        scenario = SCENARIOS[scenario_name]
        strategy = STRATEGIES[strategy_name]
        mc = self._get_model_client()

        if custom_agents:
            agents = []
            for agent in custom_agents:
                name = str(agent.get("name", "Agent")).strip() or "Agent"
                agents.append(
                    AssistantAgent(
                        name,
                        model_client=mc,
                        system_message=_custom_agent_prompt(agent, scenario, strategy),
                    )
                )
        else:
            agents = [
                AssistantAgent(
                    "Shipper",
                    model_client=mc,
                    system_message=_shipper_prompt(scenario, strategy),
                ),
                AssistantAgent(
                    "Carrier",
                    model_client=mc,
                    system_message=_carrier_prompt(scenario, strategy),
                ),
            ]
            if include_warehouse:
                agents.append(
                    AssistantAgent(
                        "Warehouse",
                        model_client=mc,
                        system_message=_warehouse_prompt(scenario, strategy),
                    )
                )

        termination = TextMentionTermination("DEAL_ACCEPTED") | TextMentionTermination(
            "DEAL_REJECTED"
        )
        team = RoundRobinGroupChat(
            agents, termination_condition=termination, max_turns=max_turns
        )
        return team

    def _build_task(
        self,
        scenario_name: str,
        include_warehouse: bool,
        custom_agents: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        sc = SCENARIOS[scenario_name]
        s, c = sc["shipper"], sc["carrier"]
        prompt = (
            f"Negotiate a shipping contract:\n"
            f"- Shipper: {s['cargo']}, {s['origin']}→{s['destination']}, "
            f"by {s['deadline']}, max ${s['max_budget']:,}.\n"
            f"- Carrier: {c['trucks']} trucks ({c['capacity_per_truck']}t), "
            f"min ${c['min_price']:,}, delivery {c['earliest_delivery']}.\n"
        )
        if include_warehouse:
            w = sc["warehouse"]
            prompt += (
                f"- Warehouse: {w['available_bays']} bays at {w['location']}, "
                f"${w['rate_per_hour']}/hr, max {w['max_storage']}t.\n"
            )
        if custom_agents:
            prompt += "- Custom logistics agents participating in the lane:\n"
            for agent in custom_agents:
                prompt += (
                    f"  - {agent.get('name', 'Agent')} ({agent.get('role', 'Operator')}): "
                    f"objective={agent.get('objective', 'Support the lane')}; "
                    f"constraints={agent.get('constraints', 'None')}.\n"
                )
        prompt += "\nBegin. Shipper goes first."
        if custom_agents:
            first_name = str(custom_agents[0].get("name", "Lead Agent"))
            prompt += f" If custom agents are provided, {first_name} should open the negotiation with the first lane proposal."
        return prompt

    # ── Streaming run (for WebSocket) ────────────────────────────────────

    async def run_stream(
        self,
        scenario_name: str = "Rush Delivery",
        strategy_name: str = "balanced",
        include_warehouse: bool = False,
        max_turns: int = 12,
        custom_agents: Optional[List[Dict[str, Any]]] = None,
    ) -> AsyncGenerator[NegMessage, None]:
        """Yield messages one at a time as agents negotiate."""
        scenario = SCENARIOS[scenario_name]
        team = self._build_team(
            scenario_name, strategy_name, include_warehouse, max_turns, custom_agents
        )
        task = self._build_task(scenario_name, include_warehouse, custom_agents)
        round_num = 0
        last_price = None
        stream = team.run_stream(task=task)
        async for event in stream:
            if not hasattr(event, "source") or not hasattr(event, "content"):
                continue
            raw_content = (
                event.content if isinstance(event.content, str) else str(event.content)
            )
            sender = (
                event.source if isinstance(event.source, str) else str(event.source)
            )
            if sender.lower() == "user":
                continue
            round_num += 1
            reasoning, public_content = _split_reasoning(raw_content)
            price = extract_price_from_message(public_content)
            if price:
                last_price = price
            # Compute utility for the agent at this point
            agent_type = sender.lower()
            util = None
            if last_price:
                if "shipper" in agent_type or "supplier" in agent_type:
                    util = calculate_utility("shipper", last_price, scenario)
                elif "carrier" in agent_type or "transport" in agent_type:
                    util = calculate_utility("carrier", last_price, scenario)
            yield NegMessage(
                round=round_num,
                sender=sender,
                content=public_content,
                timestamp=time.time(),
                price_mentioned=price,
                reasoning=reasoning,
                utility=util,
            )

    # ── Full run (returns complete result) ────────────────────────────────

    async def run(
        self,
        scenario_name: str = "Rush Delivery",
        strategy_name: str = "balanced",
        include_warehouse: bool = False,
        max_turns: int = 12,
        custom_agents: Optional[List[Dict[str, Any]]] = None,
    ) -> NegResult:
        scenario = SCENARIOS[scenario_name]
        messages: List[NegMessage] = []
        price_traj: List[Dict] = []
        util_traj: List[Dict] = []
        last_s_price = None
        last_c_price = None
        start = time.time()

        async for msg in self.run_stream(
            scenario_name, strategy_name, include_warehouse, max_turns, custom_agents
        ):
            messages.append(msg)
            if msg.price_mentioned:
                sender_lower = msg.sender.lower()
                if "shipper" in sender_lower or "supplier" in sender_lower:
                    last_s_price = msg.price_mentioned
                elif "carrier" in sender_lower or "transport" in sender_lower:
                    last_c_price = msg.price_mentioned
                price_traj.append(
                    {
                        "round": msg.round,
                        "agent": msg.sender,
                        "price": msg.price_mentioned,
                    }
                )

            ref = last_c_price or last_s_price or 0
            su = calculate_utility("shipper", ref, scenario) if ref else 0
            cu = calculate_utility("carrier", ref, scenario) if ref else 0
            util_traj.append({"round": msg.round, "shipper": su, "carrier": cu})

        duration = time.time() - start

        # Parse outcome
        final_price = None
        deal_details = ""
        success = rejected = False
        if messages:
            res = parse_deal_result(messages[-1].content)
            success = res["accepted"]
            rejected = res["rejected"]
            deal_details = res["details"]
            final_price = res["price"] or last_c_price

        su = cu = pareto = 0.0
        if final_price:
            su = calculate_utility("shipper", final_price, scenario)
            cu = calculate_utility("carrier", final_price, scenario)
            pareto = compute_pareto_efficiency(su, cu)

        # Compute baselines for comparison
        s_max = scenario["shipper"]["max_budget"]
        c_min = scenario["carrier"]["min_price"]
        c_ideal = scenario["carrier"]["ideal_price"]
        random_price = round((s_max + c_ideal) / 2)  # midpoint = naive random
        no_neg_price = c_ideal  # carrier's ideal = no negotiation

        return NegResult(
            success=success,
            rejected=rejected,
            rounds=len(messages),
            duration=duration,
            messages=messages,
            final_price=final_price,
            deal_details=deal_details,
            shipper_utility=su,
            carrier_utility=cu,
            pareto_efficiency=pareto,
            price_trajectory=price_traj,
            utility_trajectory=util_traj,
            random_allocation_price=random_price,
            no_negotiation_price=no_neg_price,
        )


# Singleton
agent_service = AgentService()
