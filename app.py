import sys, subprocess
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.ml_model import load_model
from backend.routes import report, sos

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    subprocess.Popen([sys.executable, "backend/ML/disaster_response_api.py"])
    yield
    print("🛑 Application shutting down")

app = FastAPI(
    title="Disaster Tweet Classifier API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(report.router)
app.include_router(sos.router)