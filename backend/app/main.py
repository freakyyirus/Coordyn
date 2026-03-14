"""Coordyn — FastAPI backend entry point."""

from contextlib import asynccontextmanager
from collections import defaultdict
from datetime import datetime, timedelta
import logging
import time

from fastapi import FastAPI, Request
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

from app.api import auth, market_data, routes, websocket
from app.config import settings
from app.models.database import SessionLocal, init_db
from app.utils.logging_utils import get_correlation_id, set_correlation_id

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter based on IP address."""

    def __init__(self, app, requests_per_minute: int = 60, burst: int = 10):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst = burst
        self.requests: dict = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health endpoints
        if request.url.path in (
            "/health",
            "/health/readiness",
            "/docs",
            "/openapi.json",
        ):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        minute_ago = now - 60

        # Clean old requests
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if t > minute_ago
        ]

        # Check burst limit (requests in last second)
        second_ago = now - 1
        recent_burst = sum(1 for t in self.requests[client_ip] if t > second_ago)

        if recent_burst >= self.burst:
            logger.warning(f"Rate limit burst exceeded for {client_ip}")
            raise HTTPException(status_code=429, detail="Rate limit exceeded (burst)")

        # Check per-minute limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit per minute exceeded for {client_ip}")
            raise HTTPException(
                status_code=429, detail="Rate limit exceeded (per minute)"
            )

        self.requests[client_ip].append(now)
        return await call_next(request)


class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add correlation ID to each request."""

    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID")
        if not correlation_id:
            import uuid

            correlation_id = str(uuid.uuid4())

        set_correlation_id(correlation_id)
        request.state.correlation_id = correlation_id

        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup logging
    from app.utils.logging_utils import setup_logging

    setup_logging(level="INFO", json_format=settings.is_production)

    # Startup — create tables
    init_db()
    logger.info("Coordyn API ready")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=settings.RATE_LIMIT_PER_MINUTE,
    burst=settings.RATE_LIMIT_BURST,
)

# Correlation ID middleware
app.add_middleware(CorrelationIDMiddleware)

# Mount routers
app.include_router(routes.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(market_data.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "coordyn"}


@app.get("/health/readiness")
async def readiness():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as exc:
        logger.exception("Database readiness check failed")
        raise HTTPException(status_code=503, detail="Database unavailable") from exc

    if settings.is_production and not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API key is not configured")

    return {"status": "ready", "service": "coordyn"}


# ── Metrics endpoints ─────────────────────────────────────────────────────────────


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    from app.utils.metrics import get_metrics
    from starlette.responses import Response

    return Response(content=get_metrics(), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
