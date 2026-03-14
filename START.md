# Coordyn - Multi-Agent Negotiation System

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- OpenAI API Key

### Running the Application

**1. Set up OpenAI API Key**
```powershell
# PowerShell
$env:OPENAI_API_KEY="sk-your-key-here"

# Or create a .env file in backend/:
# OPENAI_API_KEY=sk-your-key-here
```

**2. Start the Backend**
```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**3. Start the Frontend** (in a new terminal)
```powershell
cd frontend
npm install
npm run dev
```

**4. Open the application**
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

## Architecture

```
┌─────────────────────────────────────────┐
│        Frontend (React + Vite)          │
│  Home → Negotiate → Results → Batch      │
└────────────────┬────────────────────────┘
                 │ REST + WebSocket
┌────────────────▼────────────────────────┐
│        Backend (FastAPI)                │
│  Agent Service │ Negotiation Engine     │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│        Data Layer (SQLite)              │
└─────────────────────────────────────────┘
```

## Features

- **3 Agent Types**: Shipper, Carrier, Warehouse
- **3 Strategies**: Cooperative, Competitive, Balanced  
- **3 Scenarios**: Rush Delivery, Bulk Discount, Last Minute
- **Real-time Negotiation**: WebSocket-powered live chat
- **Analytics Dashboard**: Price trajectory, utility curves, Pareto efficiency
- **Strategy Comparison**: Batch simulations across all strategies
- **Deal History**: SQLite persistence
