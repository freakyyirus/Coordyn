# Coordyn - Project Status

> Decentralized multi-agent negotiation for supply-chain resource allocation (PS2 aligned)

Last updated: March 14, 2026

## Completed

### Backend

- FastAPI REST endpoints implemented in `backend/app/api/routes.py`.
- WebSocket streaming endpoint implemented in `backend/app/api/websocket.py`.
- Negotiation orchestration service implemented in `backend/app/services/agent_service.py`.
- SQLite persistence integrated in `backend/app/models/database.py`.
- Pydantic request/response schemas in `backend/app/models/schemas.py`.
- `custom_agents` payload path wired end-to-end for both REST and WebSocket negotiation runs.

### Frontend

- Premium UI shell and navigation integrated in `frontend/src/App.tsx`.
- Landing, dashboard, and inner premium views aligned to decentralized logistics narrative.
- Negotiation controls, logs, analytics, and strategy comparison views are active.
- API client and request typing support `custom_agents` in `frontend/src/services/api.ts` and `frontend/src/types/index.ts`.
- Responsive behavior and design token system maintained in `frontend/src/index.css`.

### Product Narrative

- Branding migrated to Coordyn.
- UI copy aligned with PS2 themes:
  - incomplete information,
  - conflicting objectives,
  - dynamic adaptation,
  - convergence to stable outcomes.

## In Progress

- Negotiation execution consistency:
  - streamed run path and persisted run path are still partially separate,
  - this can create transcript and saved-result divergence in edge cases.

- Utility depth:
  - baseline utility behavior is strongest for shipper/carrier roles,
  - richer role-specific utility models are still pending.

## Remaining Priorities

1. Unify stream and persistence into a single execution path.
2. Extend utility models for additional custom role profiles.
3. Expand batch-comparison semantics for mixed custom-agent rosters.
4. Add automated API and negotiation regression tests.
5. Finalize demo scripts and scenario presets for judging flow.

## Run Checklist

1. Set `OPENAI_API_KEY`.
2. Start backend: `uvicorn app.main:app --reload --port 8000` from `backend`.
3. Start frontend: `npm run dev` from `frontend`.
4. Verify health via `http://localhost:8000/docs` and live UI at `http://localhost:3000`.

## Current Risk Notes

- Missing API key blocks actual model negotiation despite successful app startup.
- The execution-path split is the main correctness risk for demo reliability.
- Test coverage is still limited for custom-agent negotiation edge cases.
