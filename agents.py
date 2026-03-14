"""
Agent definitions for the Multi-Agent Negotiation System.
Creates Shipper, Carrier, and Warehouse agents with configurable strategies.
"""

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import TextMentionTermination
from config import get_model_client, SCENARIOS, STRATEGIES


def _build_shipper_prompt(scenario: dict, strategy: dict) -> str:
    s = scenario["shipper"]
    return f"""You are a logistics **Shipper** negotiating a shipping contract.

YOUR SITUATION:
- You need to move {s['cargo']} from {s['origin']} to {s['destination']}.
- Delivery deadline: {s['deadline']}.
- Maximum budget: ${s['max_budget']:,}.
- Priority: {s['priority']}.

NEGOTIATION STYLE: {strategy['tone']}.
- {strategy['concession_rate']}.

RULES:
1. Keep each response to 2-3 sentences max. Be concise.
2. Always state specific numbers (price, time) in your proposals.
3. Track the conversation and adjust your offers based on counteroffers.
4. When you reach a deal (or it's impossible), output EXACTLY one of:
   - "DEAL_ACCEPTED: [final price], [delivery time], [capacity]"
   - "DEAL_REJECTED: [reason]"
5. Never accept a price above ${s['max_budget']:,}.
6. Start by stating your requirements and asking for a quote."""


def _build_carrier_prompt(scenario: dict, strategy: dict) -> str:
    c = scenario["carrier"]
    return f"""You are a trucking **Carrier** negotiating a shipping contract.

YOUR SITUATION:
- You have {c['trucks']} trucks available ({c['capacity_per_truck']} tons each).
- Minimum acceptable price: ${c['min_price']:,} (covers fuel/driver costs).
- Ideal price: ${c['ideal_price']:,} (for a healthy margin).
- Earliest possible delivery: {c['earliest_delivery']}.
- Current fuel surcharge: {c['fuel_surcharge']:.0%}.

NEGOTIATION STYLE: {strategy['tone']}.
- {strategy['concession_rate']}.

RULES:
1. Keep each response to 2-3 sentences max. Be concise.
2. Always state specific numbers (price, time) in your proposals.
3. Start with a higher initial quote (near your ideal price) and concede slowly.
4. Justify your pricing with operational costs (fuel, driver overtime, etc.).
5. When you reach a deal (or it's impossible), output EXACTLY one of:
   - "DEAL_ACCEPTED: [final price], [delivery time], [capacity]"
   - "DEAL_REJECTED: [reason]"
6. Never accept below ${c['min_price']:,}."""


def _build_warehouse_prompt(scenario: dict, strategy: dict) -> str:
    w = scenario["warehouse"]
    return f"""You are a **Warehouse Manager** negotiating storage and handling terms.

YOUR SITUATION:
- You have {w['available_bays']} loading bays available at {w['location']}.
- Rate: ${w['rate_per_hour']}/hour per bay.
- Minimum booking: {w['min_hours']} hours.
- Maximum storage capacity: {w['max_storage']} tons.

NEGOTIATION STYLE: {strategy['tone']}.
- {strategy['concession_rate']}.

RULES:
1. Keep each response to 2-3 sentences max. Be concise.
2. Join the negotiation by offering storage/handling services.
3. Coordinate with both the Shipper (on storage needs) and Carrier (on loading times).
4. Quote specific rates and availability windows.
5. When you reach a deal, output EXACTLY:
   - "DEAL_ACCEPTED: [rate], [hours], [bays], [total cost]"
   - "DEAL_REJECTED: [reason]"
6. Never go below ${w['rate_per_hour'] * 0.7:.0f}/hour."""


def create_negotiation_team(
    scenario_name: str = "Rush Delivery",
    strategy_name: str = "balanced",
    include_warehouse: bool = False,
    max_turns: int = 12,
):
    """
    Create a negotiation team with the given scenario and strategy.
    
    Returns:
        tuple: (team, agent_names)
    """
    scenario = SCENARIOS[scenario_name]
    strategy = STRATEGIES[strategy_name]
    model_client = get_model_client()

    shipper = AssistantAgent(
        name="Shipper",
        model_client=model_client,
        system_message=_build_shipper_prompt(scenario, strategy),
    )

    carrier = AssistantAgent(
        name="Carrier",
        model_client=model_client,
        system_message=_build_carrier_prompt(scenario, strategy),
    )

    agents = [shipper, carrier]
    agent_names = ["Shipper", "Carrier"]

    if include_warehouse:
        warehouse = AssistantAgent(
            name="Warehouse",
            model_client=model_client,
            system_message=_build_warehouse_prompt(scenario, strategy),
        )
        agents.append(warehouse)
        agent_names.append("Warehouse")

    termination = TextMentionTermination("DEAL_ACCEPTED") | TextMentionTermination("DEAL_REJECTED")

    team = RoundRobinGroupChat(
        agents,
        termination_condition=termination,
        max_turns=max_turns,
    )

    return team, agent_names


def build_task_prompt(scenario_name: str, include_warehouse: bool = False) -> str:
    """Build the initial task prompt for the negotiation."""
    scenario = SCENARIOS[scenario_name]
    s = scenario["shipper"]
    c = scenario["carrier"]

    prompt = (
        f"Negotiate a shipping contract for the following situation:\n"
        f"- Shipper needs to move {s['cargo']} from {s['origin']} to {s['destination']} "
        f"by {s['deadline']}. Max budget: ${s['max_budget']:,}.\n"
        f"- Carrier has {c['trucks']} trucks ({c['capacity_per_truck']} tons each). "
        f"Min price: ${c['min_price']:,}. Earliest delivery: {c['earliest_delivery']}.\n"
    )

    if include_warehouse:
        w = scenario["warehouse"]
        prompt += (
            f"- Warehouse at {w['location']} has {w['available_bays']} bays, "
            f"${w['rate_per_hour']}/hr, max {w['max_storage']} tons.\n"
            f"All three parties should negotiate simultaneously.\n"
        )

    prompt += "\nBegin negotiation now. Shipper, state your requirements first."
    return prompt
