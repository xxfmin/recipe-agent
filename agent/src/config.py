import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
    GEMINI_API_KEY=os.getenv("GEMINI_API_KEY")
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
    ]

config = Config()