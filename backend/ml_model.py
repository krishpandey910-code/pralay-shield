import joblib
from pathlib import Path
import sys, os
sys.path.append(os.path.abspath("backend/AI_ML/scripts/"))
import backend.AI_ML.scripts.utils as utils
import __main__
__main__.clean_series = utils.clean_series

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "backend" / "AI_ML" / "models" / "disaster_tweet_model.joblib"

model = None

def load_model():
    global model
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Train it first.")
    model = joblib.load(MODEL_PATH)
    print("✅ Model loaded successfully")

def predict_text(text: str) -> int:
    if model is None:
        raise ValueError("Model not loaded")
    return model.predict([text])[0]