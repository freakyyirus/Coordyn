# Database Migrations (Alembic)

This backend is now migration-ready for SQLite or PostgreSQL.

## 1. Install dependencies

```powershell
pip install -r requirements.txt
```

## 2. Set database URL

For development:

```powershell
$env:DATABASE_URL="sqlite:///./coordyn.db"
```

For production/staging (recommended):

```powershell
$env:DATABASE_URL="postgresql+psycopg2://user:password@host:5432/coordyn"
```

## 3. Create first migration

```powershell
Set-Location backend
alembic revision --autogenerate -m "initial schema"
```

## 4. Apply migrations

```powershell
alembic upgrade head
```

## 5. Roll back one migration

```powershell
alembic downgrade -1
```

## Notes
- Alembic uses `app.models.database.Base.metadata` for autogeneration.
- Migration runtime URL is read from `settings.DATABASE_URL` in `alembic/env.py`.
