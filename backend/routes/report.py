import os
from fastapi import APIRouter, Form, UploadFile, File, Depends
from sqlalchemy.orm import Session
from backend.models import DisasterReport
from backend.ml_model import predict_text
from backend.database import get_db

router = APIRouter()

@router.post("/report")
async def create_report(
    reporter: str = Form(...), 
    text: str = Form(...), 
    latitude: float = Form(...), 
    longitude: float = Form(...), 
    severity: str = Form(...), 
    disaster_type: str = Form(...), 
    photo: UploadFile | None = File(None), 
    voice_note: UploadFile | None = File(None),
    db: Session = Depends(get_db)  # <-- This is how we connect to MySQL!
):
    if not all([reporter, text, latitude, longitude]):
        return {"error": "Missing required fields: reporter, text, latitude, longitude"}
        
    photo_path = None
    voice_path = None
    
    if photo:
        photo_path = f"uploads/photos/{photo.filename}"
        os.makedirs("uploads/photos", exist_ok=True)
        with open(photo_path, "wb") as buffer:
            buffer.write(await photo.read())
            
    if voice_note:
        voice_path = f"uploads/voices/{voice_note.filename}"
        os.makedirs("uploads/voices", exist_ok=True)
        with open(voice_path, "wb") as buffer:
            buffer.write(await voice_note.read())
            
    prediction = predict_text(text)
    label_name = "disaster" if prediction == 1 else "not disaster"
    
    # Create a new database entry using the SQLAlchemy model
    new_report = DisasterReport(
        reporter=reporter,
        text=text,
        latitude=latitude,
        longitude=longitude,
        severity=severity,
        disaster_type=disaster_type,
        photo_path=photo_path,
        voice_note_path=voice_path,
        label=int(prediction),
        label_name=label_name
    )
    
    # Save it to the MySQL database
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return {
        "message": "Report submitted",
        "id": new_report.id,
        "classification": label_name
    }

@router.get("/reports")
async def get_reports(db: Session = Depends(get_db)):
    # Fetch all reports from MySQL
    reports = db.query(DisasterReport).all()
    return reports