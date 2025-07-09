import os
from dotenv import load_dotenv

load_dotenv()

THERAPIST_SECRET_KEY = os.getenv("THERAPIST_SECRET_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "mistral")  # Default fallback
