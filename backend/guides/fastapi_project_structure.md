# Recommended FastAPI Project Structure

This document shows a clean, scalable directory layout for a FastAPI application, explains the purpose of each folder/file, and gives quick-start commands and quality-check suggestions. Use it as a guideline and adapt names to your team's conventions.

---

## Why this layout
- Clear separation of transport (API routers), domain (models/services), and infra (database, migrations, background tasks).
- Encourages testability and small modules.
- Easy to containerize and to run with process managers or ASGI servers.

## High-level tree (recommended)

```
project_root/
├─ app/                        # application package (importable module)
│  ├─ main.py                  # ASGI app factory (create_app) / entrypoint
│  ├─ api/                     # routers / endpoints grouped by feature
│  │  ├─ __init__.py
│  │  ├─ deps.py               # dependency overrides and DI helpers
│  │  └─ users/                # feature package
│  │     ├─ router.py
│  │     └─ schemas.py
│  ├─ core/                    # configuration, constants, logging setup
│  │  └─ config.py
│  ├─ db/                      # DB session, models registration, migrations config
│  │  ├─ session.py
│  │  └─ base.py
│  ├─ models/                  # ORM models (SQLAlchemy) or DB layer
│  ├─ schemas/                 # Pydantic schemas (request/response)
│  ├─ services/                # business logic (use-cases)
│  ├─ repositories/            # DB access encapsulated (optional)
│  ├─ core/                    # app-level settings, logging
│  ├─ workers/                 # background tasks, Celery, RQ setup
│  ├─ utils/                   # small helpers
│  └─ tests/                   # tests colocated or top-level tests/
├─ migrations/                 # Alembic migrations (if using SQLAlchemy)
├─ tests/                      # pytest tests (integration/unit)
├─ scripts/                    # helper scripts (db init, seed, etc.)
├─ Dockerfile                  # container definition
├─ docker-compose.yml          # optional
├─ requirements.txt or pyproject.toml
├─ README.md
└─ .env                        # do NOT commit secrets; provide .env.example
```

> Note: Your project can use `src/` or `app/` as the package root—choose one. The layout above uses `app/` but you can adapt to `src/` if you prefer.

## Files and responsibilities (short)
- `app/main.py`
  - Create the FastAPI app instance and set up routers, startup/shutdown events, and middleware.
  - Export a factory `def create_app():` returning the app (helps tests and multiple instances).
- `app/api/*` (routers)
  - Each feature gets its own package or module (e.g., `users`, `exams`). Keep routers thin: validation + call into services.
- `app/schemas/`
  - Pydantic models for requests and responses. Separate input (CreateX) from output (XRead) if helpful.
- `app/models/` and `app/db/`
  - DB models and session management. Keep DB-specific code together.
- `app/services/` and `app/repositories/`
  - Business logic and data access abstraction. Services should be pure Python where possible and take repositories as dependencies.
- `app/core/config.py`
  - Central place to load settings via Pydantic's `BaseSettings`. Example: DB URL, redis, secret keys, CORS origins.
- `migrations/`
  - Alembic scripts if using SQLAlchemy. Keep migration setup separate from model definitions.
- `tests/`
  - Prefer pytest. Use fixtures to create test client and ephemeral DB sessions.

## Suggested app entry (contract)
- Inputs: environment variables or `.env` (loaded via Pydantic Settings) and optional DI overrides for tests.
- Outputs: ASGI app instance and routes.
- Errors: Catch startup errors and fail fast if DB connection can't be established.

## Quick example snippets (conceptual, keep in codebase, not pasted here):
- `create_app` that sets up routers and includes an event handler for DB connect/disconnect.
- `app/api/deps.py` for common dependencies (get_db, get_current_user), to be replaced in tests.

## Edge cases and considerations
- Empty or missing env: Use `.env.example` and default values in `BaseSettings`.
- Long startup time (migrations, external services): Add health check endpoints and readiness probes for containers.
- DB migrations vs models drift: Run migrations in CI and create a `check-migrations` script.
- Concurrency: Use connection pooling configuration for the DB; tune worker counts for Uvicorn/Gunicorn accordingly.

## Testing and quality gates
- Unit tests for services and small helpers.
- Integration tests using TestClient and a temporary DB (sqlite in-memory or dockerized test DB).
- Linting: flake8/ruff, black, isort.
- Type checking: mypy (optional but recommended).
- CI pipeline should run: lints, unit tests, DB migrations check, build.

## Docker and deployment notes
- Keep the container image focused: install deps, copy source, run `uvicorn app.main:create_app --factory --host 0.0.0.0 --port $PORT` or use an ASGI server manager (gunicorn + uvicorn workers).
- Use a `docker-compose.override.yml` for local development with mounted volumes and a DB service.

## Migrations
- If using SQLAlchemy, keep `alembic.ini` and `migrations/` at project root.
- Ensure Alembic's `env.py` imports models from a deterministic place (don't import side-effecting modules).

## Example commands (dev)
```bash
# run with uvicorn (module path depends on your package root)
uvicorn app.main:create_app --factory --reload --host 0.0.0.0 --port 8000

# run tests
pytest -q

# run lint
ruff . --fix
black .
```

## Minimal checklist to adopt this layout
- [ ] Pick `app/` or `src/` as top-level package and stick with it.
- [ ] Move routers into `app/api/` grouped by feature.
- [ ] Add `app/core/config.py` (Pydantic BaseSettings) and load env vars from `.env`.
- [ ] Add `app/db/session.py` and a `get_db` dependency.
- [ ] Add `tests/` and at least one integration test that creates the app via the factory.
- [ ] Add `requirements.txt` or `pyproject.toml` and a `Dockerfile`.

## Mapping from your current repository
I inspected your repository structure. You already have `src/main.py` and an `api/` package. A next step could be:
- Move `src/` contents into `app/` (or rename `src` -> `app`) or explicitly adopt `src` as package root.
- Ensure `main.py` provides a factory `create_app()`.
- Group the existing `api/` routes under `app/api/` and add `app/core/config.py`.

## Next steps
1. Choose package root (`app/` or `src/`).
2. Create an `app/core/config.py` using Pydantic BaseSettings.
3. Refactor `main.py` to expose a factory and add tests that import `create_app`.

---

If you'd like, I can:
- Generate a concrete `app/main.py` factory and small example router based on your current `src/main.py`.
- Create test scaffolding (`tests/conftest.py`, example test) that uses an in-memory DB.

Tell me which of those you'd like next and whether you prefer `app/` or `src/` as the package root.
