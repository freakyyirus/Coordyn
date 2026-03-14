from fastapi.testclient import TestClient

from app.main import app
from app.models.database import init_db


# Initialize database - TestClient with lifespan handles this
client = TestClient(app)


def test_health_endpoint() -> None:
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


def test_auth_signup_login_me_flow() -> None:
    signup_payload = {
        "full_name": "Test User",
        "email": "test.user@example.com",
        "password": "supersecret123",
        "company": "Hackathon Labs",
        "use_case": "Supply Chain",
    }

    signup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_res.status_code in (200, 409)

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": signup_payload["email"], "password": signup_payload["password"]},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me = me_res.json()
    assert me["email"] == signup_payload["email"]


def test_protected_deals_requires_auth() -> None:
    res = client.get("/api/v1/deals")
    assert res.status_code == 401
