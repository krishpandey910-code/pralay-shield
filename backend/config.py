import os
import sys
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# -------------------------
# Root Path & Environment
# -------------------------
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))
if root_path not in sys.path:
    sys.path.append(root_path)

# Load .env from project root
dotenv_path = os.path.join(root_path, ".env")
load_dotenv(dotenv_path)

# Logger for Debugging in FastAPI
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------
# MongoDB Configuration
# -------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "Disaster-Management-System")
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client[MONGO_DB_NAME]

# -------------------------
# API Configuration
# -------------------------
API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# -------------------------
# CORS Configuration
# -------------------------
BASE_URL = os.getenv("BASE_URL", "*")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    BASE_URL,
    "*" if ENVIRONMENT == "development" else BASE_URL
]

# -------------------------
# File Upload Configuration
# -------------------------
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"]
ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/mp3", "audio/wav"]