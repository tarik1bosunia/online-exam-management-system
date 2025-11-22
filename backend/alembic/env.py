from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os

# --- ADD THESE IMPORTS ---
from sqlmodel import SQLModel
from app.models import user, question, exam, attempt # Import ALL your models
from app.core.config import settings 
# -------------------------

config = context.config

# --- OVERRIDE URL FROM CONFIG ---
# This ensures it uses the same DB URL as your app
config.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))
# --------------------------------

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- SET TARGET METADATA ---
target_metadata = SQLModel.metadata
# ---------------------------

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()