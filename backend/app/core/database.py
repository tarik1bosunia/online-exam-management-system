from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings
from typing import Generator

# "postgresql://" is the standard prefix. 
# Ensure settings.DATABASE_URL matches this format in config.py
engine = create_engine(settings.DATABASE_URL, echo=True)

def create_db_and_tables():
    """Creates tables in the database based on the models."""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """Dependency to provide a database session to API endpoints."""
    with Session(engine) as session:
        yield session