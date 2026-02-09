from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
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
