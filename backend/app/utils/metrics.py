"""Prometheus metrics and OpenTelemetry tracing setup."""

import time
from functools import wraps

from prometheus_client import Counter, Gauge, Histogram, generate_latest
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.exporter.prometheus import PrometheusMetricReader

# ── Prometheus Metrics ────────────────────────────────────────────────────────────

http_requests_total = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

negotiations_total = Counter(
    "negotiations_total", "Total negotiations started", ["scenario", "strategy"]
)

negotiations_active = Gauge("negotiations_active", "Number of active negotiations")

negotiation_duration_seconds = Histogram(
    "negotiation_duration_seconds",
    "Negotiation duration in seconds",
    ["scenario", "strategy", "outcome"],
)

auth_attempts_total = Counter(
    "auth_attempts_total", "Total authentication attempts", ["endpoint", "status"]
)

websocket_connections_active = Gauge(
    "websocket_connections_active", "Number of active WebSocket connections"
)


# ── OpenTelemetry Tracing ───────────────────────────────────────────────────────


def setup_tracing(service_name: str = "coordyn"):
    """Initialize OpenTelemetry tracing."""
    resource = Resource.create({"service.name": service_name})
    provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(provider)
    return provider


def instrument_fastapi(app, provider):
    """Instrument FastAPI with OpenTelemetry."""
    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)


# ── Metrics Helper Functions ───────────────────────────────────────────────────


def track_request(method: str, endpoint: str, status: int, duration: float):
    """Record HTTP request metrics."""
    http_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
    http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(
        duration
    )


def track_negotiation_start(scenario: str, strategy: str):
    """Record negotiation start."""
    negotiations_total.labels(scenario=scenario, strategy=strategy).inc()
    negotiations_active.inc()


def track_negotiation_end(scenario: str, strategy: str, outcome: str, duration: float):
    """Record negotiation end."""
    negotiations_active.dec()
    negotiation_duration_seconds.labels(
        scenario=scenario, strategy=strategy, outcome=outcome
    ).observe(duration)


def track_auth_attempt(endpoint: str, success: bool):
    """Record authentication attempt."""
    status = "success" if success else "failure"
    auth_attempts_total.labels(endpoint=endpoint, status=status).inc()


def get_metrics():
    """Generate Prometheus metrics endpoint data."""
    return generate_latest()


# Decorator for tracing function calls
def traced(span_name: str = None):
    """Decorator to trace function execution."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            name = span_name or func.__name__
            with trace.get_tracer(__name__).start_as_current_span(name) as span:
                span.set_attribute("function.name", func.__name__)
                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("result", "success")
                    return result
                except Exception as e:
                    span.set_attribute("result", "error")
                    span.set_attribute("error.message", str(e))
                    raise

        return wrapper

    return decorator
