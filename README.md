# Coordyn — Decentralized Multi-Agent Negotiation Platform

> Decentralized multi-agent negotiation for supply-chain resource allocation (PS2 Aligned)

Coordyn is a production-ready platform for simulating and running autonomous multi-agent negotiations in logistics and supply chain scenarios. It models independent actors—shippers, carriers, warehouses—with conflicting objectives under incomplete information, enabling teams to study how decentralized coordination converges to stable outcomes.

---

## Problem Statement Alignment

This project directly addresses **PS2: Decentralized Multi-Agent Negotiation for Supply-Chain Resource Allocation**:

| PS2 Requirement | Coordyn Implementation |
|-----------------|----------------------|
| **Incomplete Information** | Each agent operates with partial knowledge of other actors' constraints, limits, and true intentions |
| **Conflicting Objectives** | Shippers minimize cost, carriers maximize profit, warehouses optimize utilization—objectives are mathematically modeled and in tension |
| **Dynamic Adaptation** | Agents adapt strategy each round based on received proposals and market feedback |
| **Convergence** | Track Pareto efficiency, utility trajectories, and price convergence toward stable agreements |

---

## Key Features

### 🤖 Multi-Agent Negotiation Engine
- **Customizable Agents**: Define agents with name, role, objective, constraints, and strategy
- **Role Profiles**: Pre-built shipper, carrier, and warehouse agent profiles with realistic utility functions
- **Strategies**: Cooperative, competitive, and balanced negotiation approaches
- **Round-Based Bargaining**: Configurable max turns (4-20) with real-time proposal evaluation

### 📊 Scenario Management
- **Built-in Scenarios**: Rush Delivery, Bulk Freight, Cold Chain, Last-Mile
- **Custom Environments**: Define demand, capacity scarcity, budget limits, deadline pressure
- **Real-World Prompts**: Quick-start examples like "3PL lane pricing for same-day delivery"

### 🔄 Real-Time Execution
- **REST API**: Synchronous negotiation with full transcript and metrics
- **WebSocket Streaming**: Live message streaming with per-round updates
- **Batch Comparison**: Run multiple strategies side-by-side to compare outcomes

### 📈 Analytics & Insights
- **Utility Tracking**: Measure shipper/carrier utility and Pareto efficiency
- **Price Trajectory**: Visualize how agreed prices evolve across rounds
- **Deal Rate Analysis**: Compare success rates across strategies
- **Blockchain Ledger**: Mock immutable deal logging

### 🔐 Production-Ready Backend
- **JWT Authentication**: Secure signup/login with access tokens
- **Role-Based Authorization**: Admin and user roles for access control
- **Rate Limiting**: Configurable burst and per-minute limits
- **Structured Logging**: JSON logging with correlation IDs for tracing

### 📊 Observability
- **Prometheus Metrics**: HTTP request counters, latency histograms, negotiation tracking
- **OpenTelemetry Tracing**: Distributed tracing instrumentation
- **Health Checks**: `/health` and `/health/readiness` endpoints

### 🖥️ Premium Frontend
- **Landing Page**: Productized UX with logistics-focused messaging
- **Dashboard**: Real-time negotiation monitoring
- **Environment Builder**: Visual environment configuration
- **Agent Studio**: Custom agent definition interface
- **Analytics View**: Charts for utility, price, and strategy comparison

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React + Vite)                 │
│  Landing → Dashboard → Negotiate/Analytics/Environment/Agents  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST + WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│                       Backend (FastAPI)                          │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │  Auth   │  │ Routes  │  │ WebSocket│  │ Market Data     │   │
│  └────┬────┘  └────┬────┘  └────┬─────┘  └────────┬────────┘   │
│       │            │            │                  │             │
│  ┌────▼────────────▼────────────▼──────────────────▼────────┐  │
│  │              Agent Service (AutoGen + OpenAI)              │  │
│  │   ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐   │  │
│  │   │ Shipper │  │ Carrier  │  │Warehouse│  │ Custom   │   │  │
│  │   │ Agent   │  │  Agent   │  │ Agent   │  │ Agents   │   │  │
│  │   └─────────┘  └──────────┘  └─────────┘  └──────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            │                                      │
│  ┌─────────────────────────▼────────────────────────────────┐   │
│  │     Database (SQLite dev / PostgreSQL prod)                │   │
│  │     Negotiations | Users | Blockchain Ledger               │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Zustand, Recharts, React Flow, Framer Motion |
| Backend | FastAPI, SQLAlchemy, Pydantic, AutoGen, OpenAI GPT-4o |
| Auth | JWT (python-jose), Passlib |
| Database | SQLite (dev), PostgreSQL (prod), Alembic migrations |
| Observability | Prometheus, OpenTelemetry |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- OpenAI API key

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and other settings

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Access the Application
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/health/readiness` | GET | Readiness check with DB validation |
| `/api/v1/auth/signup` | POST | User registration |
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/auth/refresh` | POST | Token refresh |
| `/api/v1/auth/me` | GET | Get current user |
| `/api/v1/info` | GET | Get scenarios and strategies |
| `/api/v1/negotiate` | POST | Run single negotiation |
| `/api/v1/negotiate/batch` | POST | Batch strategy comparison |
| `/api/v1/deals` | GET | Get negotiation history |
| `/api/v1/blockchain/ledger` | GET | Get blockchain ledger |
| `/api/v1/market-data/context` | GET | Get market context |
| `/ws/negotiate` | WebSocket | Streaming negotiation |
| `/metrics` | GET | Prometheus metrics |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Runtime environment | `development` |
| `DATABASE_URL` | Database connection string | `sqlite:///./coordyn.db` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_MODEL` | Model to use | `gpt-4o-mini` |
| `JWT_SECRET_KEY` | Secret for JWT signing | `dev-insecure-secret-change-me` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | `60` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `RATE_LIMIT_PER_MINUTE` | Rate limit | `60` |
| `RATE_LIMIT_BURST` | Burst limit | `10` |
| `DB_POOL_SIZE` | PostgreSQL pool size | `5` |
| `DB_MAX_OVERFLOW` | PostgreSQL overflow | `10` |

---

## Running in Production

1. **Set environment variables**:
   ```bash
   ENVIRONMENT=production
   DATABASE_URL=postgresql://user:pass@host:5432/coordyn
   OPENAI_API_KEY=sk-...
   JWT_SECRET_KEY=<secure-random-string>
   ```

2. **Run database migrations**:
   ```bash
   cd backend
   alembic upgrade head
   ```

3. **Start with a process manager** (e.g., gunicorn/uvicorn):
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/           # REST routes, WebSocket, auth
│   │   ├── models/        # DB models and schemas
│   │   ├── services/      # Business logic (agent, blockchain)
│   │   ├── utils/         # Helpers, logging, metrics
│   │   ├── config.py      # Settings
│   │   └── main.py        # App entry
│   ├── alembic/           # DB migrations
│   ├── tests/             # Backend tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client
│   │   ├── store/         # Zustand store
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── .github/
│   └── workflows/         # CI/CD pipeline
└── README.md
```

---

## License

MIT License © 2026 Coordyn
