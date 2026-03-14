from __future__ import annotations

import os
import sys
from pathlib import Path

# Set test env vars before importing app modules
os.environ["DATABASE_URL"] = "sqlite:///./test_coordyn.db"
os.environ["ENVIRONMENT"] = "test"
os.environ["OPENAI_API_KEY"] = "test-key"

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Clear settings cache to pick up test env vars
from app import config

config.get_settings.cache_clear()

# Reset database module globals to use test database
from app.models import database

database._engine = None
database._session_factory = None

# Initialize the test database
from app.models.database import init_db

init_db()
