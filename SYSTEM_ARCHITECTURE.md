# Autonomous Multi-Agent Negotiation Architecture

## What model are you building?

You are building a **Generative-AI multi-agent negotiation simulator** for decentralized systems.

- Core model type: `LLM-powered agent society` (AutoGen group chat orchestration)
- Current model provider: OpenAI Chat Completions via `OpenAIChatCompletionClient`
- Current default model: `gpt-4o-mini` (configurable via `OPENAI_MODEL`)

Code reference:
- `backend/app/services/agent_service.py`
- `backend/app/config.py`

## Which agents do you have?

Current implemented actor agents:
- `Shipper` (minimize logistics cost under budget/deadline constraints)
- `Carrier` (maximize revenue and utilization under minimum pricing constraints)
- `Warehouse` (optional, optimize storage handling economics)

Each agent has:
- role-specific system prompt
- strategy style (`balanced`, `competitive`, `cooperative`)
- hard constraints and deal rules

Code reference:
- `backend/app/services/agent_service.py`

## How this is Autonomous Multi-Agent Negotiation in Decentralized Systems

Your system satisfies the problem statement as follows:

1. **Multiple independent actors**
- Each agent is instantiated independently with its own objective and constraints.

2. **Conflicting objectives**
- Shipper, Carrier, and Warehouse have competing utility functions.

3. **Incomplete information and iterative coordination**
- Agents negotiate over rounds with partial visibility and evolving offers.

4. **Structured negotiation protocol**
- Propose -> counter-offer -> concession -> accept/reject with bounded rounds.

5. **Convergence metrics**
- Outcome includes agreement status, rounds, utilities, and Pareto efficiency.

Code reference:
- `backend/app/services/agent_service.py`
- `backend/app/models/schemas.py`
- `backend/app/api/routes.py`

## Real data integration (implemented)

Authenticated endpoint for external context:
- `GET /api/v1/market-data/context`

Current live data adapters:
- FX rates (`frankfurter.app`)
- Crypto volatility snapshot (`coingecko.com`)
- Weather risk proxy (`open-meteo.com`)

Code reference:
- `backend/app/services/market_data_service.py`
- `backend/app/api/market_data.py`
- `frontend/src/services/api.ts`
- `frontend/src/App.tsx` (right-rail "Fetch Real Market Data")

## Why this matters to the challenge

Real-world decentralized negotiation requires changing context (prices, volatility, weather, capacity shocks). These inputs are now fetchable in real time and can be used to condition negotiation scenarios and strategy behavior.

## Next production-grade enhancement

- Inject `market_data` context directly into agent prompts for each run.
- Persist external signals with each negotiation for auditability and replay.
- Add strategy adaptation from historical outcomes (RL or policy tuning).
