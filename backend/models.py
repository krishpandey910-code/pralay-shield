from pydantic import BaseModel

class PredictRequest(BaseModel):
    text: str

class DisasterReport(BaseModel):
    reporter: str
    text: str
    latitude: float
    longitude: float

class SOSAlert(BaseModel):
    reporter: str
    latitude: float
    longitude: float
    description: str | None = None
    severity: str = "critical"
    isSOSAlert: bool = True
    timestamp: str | None = None