import os
import logging

from dotenv import load_dotenv
from groq import AsyncGroq

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    logger.warning(
        "GROQ_API_KEY is not set. AI features will fail. "
        
    )

client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def get_groq_client() -> AsyncGroq:
    if client is None:
        raise RuntimeError("GROQ_API_KEY is not configured")
    return client










