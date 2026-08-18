import re
import joblib
from pathlib import Path
import numpy as np

# Same cleaning functions used in training
def clean_text(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = s.lower()
    s = re.sub(r"http\S+|www\.\S+", " ", s)
    s = re.sub(r"@\w+", " ", s)
    s = re.sub(r"#", " ", s)
    s = re.sub(r"[^a-z\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def clean_series(texts):
    return np.array([clean_text(t) for t in texts])

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent  # disaster-management/
MODEL_PATH = BASE_DIR / "AI_ML" / "models" / "disaster_tweet_model.joblib"

# Load model
print(f"Loading model from: {MODEL_PATH}")
model = joblib.load(MODEL_PATH)

# Ask for user input
while True:
    text = input("\nEnter a tweet (or 'quit' to exit): ")
    if text.lower() == "quit":
        break
    prediction = model.predict([text])[0]
    label = "Disaster" if prediction == 1 else "Not Disaster"
    print(f"Prediction: {label}")