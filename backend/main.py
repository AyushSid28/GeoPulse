import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.stations import router as stations_router
from app.api.trains import router as trains_router
from app.redis import redis_client
from app.api.ai import router as ai_router
from app.api.offline import router as offline_router
from app.api.alerts import router as alerts_router

load_dotenv()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
   
    try:
        await redis_client.ping()
        logger.info("Redis connection OK")
    except Exception as e:
        logger.warning("Redis not reachable at startup: %s (app will still start)", e)
    yield
    
    await redis_client.aclose()


app = FastAPI(
    title="GeoPulse API",
    description="Train tracking API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stations_router)
app.include_router(trains_router)
app.include_router(ai_router)
app.include_router(offline_router)
app.include_router(alerts_router)

@app.get("/")
def read_root():
    return {"message": "GeoPulse API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
