from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import create_db_and_tables

# Import Routers
from app.api.v1 import auth, questions, exams, attempts

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# specific origins (good for security)
origins = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     # Allow Frontend
    allow_credentials=True,    # Allow Cookies/Auth headers
    allow_methods=["*"],       # Allow all methods (POST, GET, OPTIONS, etc.)
    allow_headers=["*"],       # Allow all headers
)

# Register Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(questions.router, prefix="/api/v1/questions", tags=["Questions"]) 
app.include_router(exams.router, prefix="/api/v1/exams", tags=["Exams"])
app.include_router(attempts.router, prefix="/api/v1/attempts", tags=["Attempts"])

@app.get("/")
def read_root():
    return {"message": "System Running"}