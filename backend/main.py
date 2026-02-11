from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import httpx
import requests
from dotenv import load_dotenv


load_dotenv()
app = FastAPI(title="GeoPulse API", description="Train tracking API")

origins = ["http://localhost:3000", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL=os.getenv("DATABASE_URL")

@app.get("/")
def read_root():
    return {"message": "Hello,FastAPI!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/stations")
def get_stations():
    station=db.query(railway_db).all()
    if not station:
        raise HTTPException(status_code=404,detail="Station not found!")
    return station

@app.get(f"/api/stations/{id}")
def get_station(id:str):


@app.get("/api/trains")
def get_trains():

@app.get(f"/api/trains/{id}")
def get_train(id:str):