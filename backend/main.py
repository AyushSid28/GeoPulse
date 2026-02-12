from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.stations import router as stations_router
from app.api.trains import router as trains_router

load_dotenv()

app = FastAPI(title="GeoPulse API", description="Train tracking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stations_router)
app.include_router(trains_router)


@app.get("/")
def read_root():
    return {"message": "GeoPulse API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}