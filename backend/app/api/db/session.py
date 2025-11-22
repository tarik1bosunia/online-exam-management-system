import sqlmodel
from sqlmodel import SQLModel, Session

from .config import DATABASE_URL

# Ensure DATABASE_URL is set and use a string value for create_engine
if not DATABASE_URL:
    raise ValueError("DATABASE_URL must be set in config")
engine = sqlmodel.create_engine(str(DATABASE_URL))

def init_db():
    print("Initializing the database...")
    SQLModel.metadata.create_all(engine)
    # print("creating hypertables...")
    # timescaledb.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
    
    