from fastapi import APIRouter, Form, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from backend.models import SOSAlert
from backend.database import get_db

router = APIRouter()

@router.post("/sos")
async def sos_alert(
    reporter: str | None = Form(None),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    description: str | None = Form(None),
    severity: str | None = Form("critical"),
    timestamp: str | None = Form(None),
    db: Session = Depends(get_db)  # <-- Our MySQL connection!
):
    if not all([reporter, latitude, longitude]):
        return {"error": "Missing required fields: reporter, latitude, longitude"}

    if timestamp is None:
        timestamp = datetime.utcnow().isoformat()

    # Create the new SOS Alert using the SQLAlchemy model
    new_alert = SOSAlert(
        reporter=reporter,
        latitude=latitude,
        longitude=longitude,
        description=description,
        severity=severity,
        timestamp=timestamp
    )

    # Save to the MySQL database
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return {
        "message": "SOS alert received",
        "id": new_alert.id,
        "data": {
            "reporter": new_alert.reporter,
            "latitude": new_alert.latitude,
            "longitude": new_alert.longitude,
            "description": new_alert.description,
            "severity": new_alert.severity,
            "timestamp": new_alert.timestamp,
            "id": new_alert.id
        }
    }

@router.get("/sos")
async def get_sos_alerts(db: Session = Depends(get_db)):
    # Fetch all SOS alerts properly from the database
    alerts = db.query(SOSAlert).all()
    return {"count": len(alerts), "data": alerts}