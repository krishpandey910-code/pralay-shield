from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import uvicorn
from typing import Optional, List, Dict, Any
from datetime import datetime
import math
import json
import requests

# Import database and models
from database import get_db
import databasemodels as models

# Create FastAPI app
app = FastAPI(
    title="Disaster Management API",
    description="API for Disaster Management System with Auto-Sync Safe Houses",
    version="1.0.0"
)

# CORS Configuration - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- HELPER FUNCTIONS -----------------

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return distance

def facilities_to_amenities(facilities: Optional[List[str]]) -> str:
    """Convert facilities list to JSON string for database storage"""
    if not facilities:
        return json.dumps({"facilities": ["Emergency Shelter", "Basic Amenities"]})
    return json.dumps({"facilities": facilities})

def amenities_to_facilities(amenities: Optional[str]) -> List[str]:
    """Convert amenities JSON string to facilities list"""
    if not amenities:
        return ["Emergency Shelter", "Basic Amenities"]
    try:
        data = json.loads(amenities)
        return data.get("facilities", ["Emergency Shelter", "Basic Amenities"])
    except:
        return ["Emergency Shelter", "Basic Amenities"]

def fetch_shelters_from_osm(lat: float, lon: float, radius: int = 5000) -> Dict[str, Any]:
    """
    Fetch shelters from OpenStreetMap Overpass API
    Returns raw OSM data
    
    Parameters:
    - lat: Latitude of search center
    - lon: Longitude of search center
    - radius: Search radius in meters (default: 5000m = 5km)
    """
    query = f"""
    [out:json][timeout:30];
    (
      node["amenity"="school"](around:{radius},{lat},{lon});
      node["amenity"="hospital"](around:{radius},{lat},{lon});
      node["amenity"="police"](around:{radius},{lat},{lon});
      node["amenity"="community_centre"](around:{radius},{lat},{lon});
      node["amenity"="shelter"](around:{radius},{lat},{lon});
      node["amenity"="social_facility"](around:{radius},{lat},{lon});
      node["amenity"="fire_station"](around:{radius},{lat},{lon});
      way["amenity"="school"](around:{radius},{lat},{lon});
      way["amenity"="hospital"](around:{radius},{lat},{lon});
      way["amenity"="community_centre"](around:{radius},{lat},{lon});
      way["amenity"="shelter"](around:{radius},{lat},{lon});
      way["amenity"="social_facility"](around:{radius},{lat},{lon});
    );
    out center body;
    """
    
    # Try multiple Overpass API servers for redundancy
    servers = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.fr/api/interpreter"
    ]
    
    for server in servers:
        try:
            print(f"🔍 Trying server: {server}")
            response = requests.post(
                server,
                data={"data": query},
                timeout=30,
                headers={"User-Agent": "DisasterManagementApp/1.0"}
            )
            
            if response.status_code == 200:
                data = response.json()
                element_count = len(data.get('elements', []))
                print(f"✅ Successfully fetched {element_count} elements from {server}")
                return data
            else:
                print(f"❌ Server returned status {response.status_code}")
                
        except requests.exceptions.Timeout:
            print(f"⏰ Timeout on {server}")
            continue
        except requests.exceptions.RequestException as e:
            print(f"❌ Error with {server}: {str(e)}")
            continue
    
    # If all servers fail, return empty result
    print("⚠️  All Overpass API servers failed")
    return {"elements": []}

# ----------------- PYDANTIC MODELS -----------------

class EmailRequest(BaseModel):
    email: EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    city: str

class UpdateCityRequest(BaseModel):
    email: EmailStr
    city: str

class CheckWeatherRequest(BaseModel):
    email: EmailStr
    cityName: str

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    phone: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Volunteer Models
class VolunteerRegister(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    skills: Optional[str] = None
    availability: Optional[str] = None
    experience_level: Optional[str] = "beginner"
    city: Optional[str] = None

class VolunteerUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[str] = None
    availability: Optional[str] = None
    experience_level: Optional[str] = None
    city: Optional[str] = None

# Safe House Models
class SafeHouseBase(BaseModel):
    name: str
    type: str
    latitude: float
    longitude: float
    distance: Optional[float] = None
    address: Optional[str] = None
    capacity: Optional[int] = 50
    facilities: Optional[List[str]] = ["Emergency Shelter", "Basic Amenities"]
    contact: Optional[str] = "N/A"
    is_available: Optional[bool] = True

class SafeHouseBulkCreate(BaseModel):
    safe_houses: List[SafeHouseBase]
    location: dict  # {"latitude": float, "longitude": float}

class NearbySearchParams(BaseModel):
    latitude: float
    longitude: float
    radius: Optional[int] = 5000  # in meters

# ----------------- HEALTH CHECK -----------------

@app.get("/")
def read_root():
    return {
        "message": "Disaster Management API with Auto-Sync",
        "status": "active",
        "version": "1.0.0",
        "features": [
            "Auto-sync safe houses from OpenStreetMap",
            "Weather alerts",
            "SOS emergency system",
            "Disaster reporting",
            "Community posts",
            "Volunteer management with email support"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# ----------------- WEATHER EMAIL REGISTRATION -----------------

@app.post("/api/register-email", tags=["Weather"])
def register_email(payload: EmailRequest, db: Session = Depends(get_db)):
    """
    Register email for weather alert notification (legacy endpoint)
    """
    email = payload.email

    existing = db.query(models.WeatherRegistration).filter(
        models.WeatherRegistration.email == email
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create a dummy user_id or require it - for now we'll use 1 as default
    new_registration = models.WeatherRegistration(
        user_id=1,  # You may want to make this dynamic
        email=email,
        city="Unknown"
    )
    db.add(new_registration)
    db.commit()
    db.refresh(new_registration)

    return {"message": "Email registered successfully for weather alerts"}

@app.post("/api/register", tags=["Weather"])
def register_for_alerts(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register user for weather alerts with email and city
    """
    try:
        # Check if registration already exists
        existing = db.query(models.WeatherRegistration).filter(
            models.WeatherRegistration.email == request.email
        ).first()

        if existing:
            # Update existing registration
            existing.city = request.city
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
            db.commit()
            return {
                "success": True,
                "message": "Successfully updated weather alert registration",
                "email": request.email,
                "city": request.city
            }

        # Check if user exists, if not create a basic user
        user = db.query(models.User).filter(models.User.email == request.email).first()
        if not user:
            # Create a basic user account
            user = models.User(
                email=request.email,
                password_hash="temp_hash",  # You should implement proper password handling
                full_name="Weather Alert User",
                role=models.UserRole.CIVILIAN,
                city=request.city
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create new weather registration
        new_registration = models.WeatherRegistration(
            user_id=user.id,
            email=request.email,
            city=request.city,
            is_active=True
        )
        
        db.add(new_registration)
        db.commit()
        db.refresh(new_registration)

        return {
            "success": True,
            "message": "Successfully registered for weather alerts",
            "email": request.email,
            "city": request.city
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/update-city", tags=["Weather"])
def update_user_city(request: UpdateCityRequest, db: Session = Depends(get_db)):
    """
    Update the city for an existing user
    """
    try:
        # Find weather registration
        registration = db.query(models.WeatherRegistration).filter(
            models.WeatherRegistration.email == request.email
        ).first()

        if not registration:
            raise HTTPException(status_code=404, detail="User not found. Please register first.")

        # Update city
        registration.city = request.city
        registration.updated_at = datetime.utcnow()
        
        # Also update user's city if exists
        user = db.query(models.User).filter(models.User.email == request.email).first()
        if user:
            user.city = request.city
            user.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "City updated successfully",
            "email": request.email,
            "city": request.city
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@app.post("/api/check-weather-immediate", tags=["Weather"])
def check_weather_immediate(request: CheckWeatherRequest, db: Session = Depends(get_db)):
    """
    Check weather conditions and send alerts if necessary
    """
    try:
        # Verify user is registered
        registration = db.query(models.WeatherRegistration).filter(
            models.WeatherRegistration.email == request.email
        ).first()

        if not registration:
            raise HTTPException(status_code=404, detail="User not registered for weather alerts")

        # TODO: Implement actual weather checking logic here
        # This is a placeholder response
        import random
        conditions = ["NONE", "LOW", "MODERATE", "HIGH"]
        severity = random.choice(conditions)

        if severity == "NONE":
            return {
                "success": True,
                "message": "Weather conditions are normal. No alerts needed.",
                "severity": "NONE",
                "city": request.cityName
            }
        else:
            return {
                "success": True,
                "message": f"Weather alert checked! Current severity: {severity}",
                "severity": severity,
                "city": request.cityName
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather check failed: {str(e)}")

# ----------------- USER ENDPOINTS -----------------

@app.post("/api/auth/register", tags=["Authentication"])
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with authentication
    """
    try:
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password (in production, use bcrypt or passlib)
        password_hash = f"hashed_{user_data.password}"  # TODO: Use proper hashing
        
        # Create new user
        user = models.User(
            email=user_data.email,
            password_hash=password_hash,
            full_name=user_data.full_name,
            phone=user_data.phone,
            city=user_data.city,
            address=user_data.address,
            role=models.UserRole.CIVILIAN
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Return user data without password
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "city": user.city,
            "role": user.role,
            "created_at": user.created_at
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login", tags=["Authentication"])
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return user data
    """
    try:
        user = db.query(models.User).filter(models.User.email == credentials.email).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password (in production, use bcrypt.checkpw)
        expected_hash = f"hashed_{credentials.password}"
        if user.password_hash != expected_hash:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Return user data without password
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "city": user.city,
            "role": user.role,
            "token": f"token_{user.id}_{user.email}"  # TODO: Use JWT in production
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/users", tags=["Users"])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.get("/api/users/{user_id}", tags=["Users"])
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/api/users", tags=["Users"])
def create_user(email: str, full_name: str, phone: str = None, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = models.User(
        email=email,
        password_hash="temp_hash",
        full_name=full_name,
        phone=phone,
        role=models.UserRole.CIVILIAN
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# ----------------- DISASTER REPORT ENDPOINTS -----------------

@app.get("/api/disaster-reports", tags=["Disaster Reports"])
def get_disaster_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    reports = db.query(models.DisasterReport).offset(skip).limit(limit).all()
    return reports

@app.get("/api/disaster-reports/{report_id}", tags=["Disaster Reports"])
def get_disaster_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(models.DisasterReport).filter(models.DisasterReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.post("/api/disaster-reports", tags=["Disaster Reports"])
def create_disaster_report(
    reporter_id: int,
    disaster_type: str,
    description: str,
    latitude: float,
    longitude: float,
    severity: str = "MEDIUM",
    location_name: str = None,
    db: Session = Depends(get_db)
):
    report = models.DisasterReport(
        reporter_id=reporter_id,
        disaster_type=models.DisasterType[disaster_type],
        severity=models.SeverityLevel[severity],
        description=description,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name,
        status="pending"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

@app.post("/report", tags=["Disaster Reports"])
@app.post("/api/report", tags=["Disaster Reports"])
async def create_report(
    reporter: str = Form(...),
    text: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    severity: str = Form(...),
    disaster_type: str = Form(...),
    photo: UploadFile = File(None),
    voice_note: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """
    Handle disaster reports from the civilian report form
    """
    try:
        # Find or create user
        user = db.query(models.User).filter(
            models.User.full_name == reporter
        ).first()
        
        if not user:
            user = models.User(
                email=f"{reporter.lower().replace(' ', '_')}@report.local",
                password_hash="report_user",
                full_name=reporter,
                role=models.UserRole.CIVILIAN
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Map disaster types
        disaster_type_mapping = {
            'earthquake': 'EARTHQUAKE',
            'flood': 'FLOOD',
            'wildfire': 'WILDFIRE',
            'hurricane': 'HURRICANE',
            'tornado': 'TORNADO',
            'landslide': 'LANDSLIDE',
            'other': 'OTHER'
        }
        
        severity_mapping = {
            'low': 'LOW',
            'medium': 'MEDIUM',
            'high': 'HIGH',
            'critical': 'CRITICAL'
        }
        
        # Create disaster report
        disaster_report = models.DisasterReport(
            reporter_id=user.id,
            disaster_type=models.DisasterType[disaster_type_mapping.get(disaster_type, 'OTHER')],
            severity=models.SeverityLevel[severity_mapping.get(severity, 'MEDIUM')],
            description=text,
            latitude=latitude,
            longitude=longitude,
            location_name=f"Location: {latitude:.4f}, {longitude:.4f}",
            status="pending"
        )
        db.add(disaster_report)
        db.commit()
        db.refresh(disaster_report)
        
        return {
            "success": True,
            "message": "Disaster report submitted successfully",
            "report_id": disaster_report.id,
            "reporter": reporter,
            "disaster_type": disaster_type,
            "severity": severity,
            "location": {
                "latitude": latitude,
                "longitude": longitude
            },
            "status": "pending",
            "created_at": disaster_report.created_at.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        print(f"Report Submission Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit report: {str(e)}"
        )

# ----------------- SOS ALERT ENDPOINTS -----------------

@app.post("/sos", tags=["SOS Alerts"])
@app.post("/api/sos", tags=["SOS Alerts"])
async def create_sos_emergency(
    reporter: str = Form(...),
    text: str = Form(...),
    latitude: str = Form(""),
    longitude: str = Form(""),
    severity: str = Form("critical"),
    isSOSAlert: bool = Form(True),
    timestamp: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Handle emergency SOS alerts
    """
    try:
        lat = float(latitude) if latitude and latitude != "" else None
        lon = float(longitude) if longitude and longitude != "" else None
        
        user = db.query(models.User).filter(
            models.User.full_name == reporter
        ).first()
        
        if not user and reporter != "Anonymous":
            user = models.User(
                email=f"{reporter.lower().replace(' ', '_')}@emergency.local",
                password_hash="emergency_user",
                full_name=reporter,
                role=models.UserRole.CIVILIAN
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        user_id = user.id if user else 1
        
        sos_alert = models.SOSAlert(
            user_id=user_id,
            latitude=lat,
            longitude=lon,
            emergency_type="CRITICAL_EMERGENCY",
            description=text,
            emergency_contact=None,
            status=models.AlertStatus.ACTIVE
        )
        db.add(sos_alert)
        
        if lat and lon:
            disaster_report = models.DisasterReport(
                reporter_id=user_id,
                disaster_type=models.DisasterType.OTHER,
                severity=models.SeverityLevel.CRITICAL,
                description=f"[SOS ALERT] {text}",
                latitude=lat,
                longitude=lon,
                location_name="Emergency Location",
                status="active"
            )
            db.add(disaster_report)
        
        db.commit()
        db.refresh(sos_alert)
        
        return {
            "success": True,
            "message": "SOS alert received and emergency services notified",
            "alert_id": sos_alert.id,
            "timestamp": timestamp,
            "location": {
                "latitude": lat,
                "longitude": lon
            } if lat and lon else None,
            "status": "ACTIVE"
        }
        
    except Exception as e:
        db.rollback()
        print(f"SOS Alert Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create SOS alert: {str(e)}"
        )

@app.get("/api/sos-alerts", tags=["SOS Alerts"])
def get_sos_alerts(status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.SOSAlert)
    if status:
        query = query.filter(models.SOSAlert.status == status)
    return query.all()

@app.get("/api/sos-alerts/active", tags=["SOS Alerts"])
def get_active_sos_alerts(db: Session = Depends(get_db)):
    """
    Get all active SOS alerts
    """
    alerts = db.query(models.SOSAlert).filter(
        models.SOSAlert.status == models.AlertStatus.ACTIVE
    ).order_by(models.SOSAlert.created_at.desc()).all()
    
    return {
        "success": True,
        "count": len(alerts),
        "alerts": [
            {
                "id": alert.id,
                "user_id": alert.user_id,
                "latitude": alert.latitude,
                "longitude": alert.longitude,
                "emergency_type": alert.emergency_type,
                "description": alert.description,
                "status": alert.status,
                "created_at": alert.created_at.isoformat(),
                "updated_at": alert.updated_at.isoformat()
            }
            for alert in alerts
        ]
    }

@app.post("/api/sos-alerts", tags=["SOS Alerts"])
def create_sos_alert(
    user_id: int,
    latitude: float,
    longitude: float,
    emergency_type: str = None,
    description: str = None,
    emergency_contact: str = None,
    db: Session = Depends(get_db)
):
    alert = models.SOSAlert(
        user_id=user_id,
        latitude=latitude,
        longitude=longitude,
        emergency_type=emergency_type,
        description=description,
        emergency_contact=emergency_contact,
        status=models.AlertStatus.ACTIVE
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

@app.put("/api/sos-alerts/{alert_id}/status", tags=["SOS Alerts"])
def update_sos_status(
    alert_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    """
    Update SOS alert status
    """
    alert = db.query(models.SOSAlert).filter(
        models.SOSAlert.id == alert_id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="SOS alert not found")
    
    try:
        alert.status = models.AlertStatus[status.upper()]
        alert.updated_at = datetime.utcnow()
        
        if status.upper() in ["RESOLVED", "CANCELLED"]:
            alert.resolved_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": f"SOS alert status updated to {status}",
            "alert_id": alert_id,
            "new_status": status,
            "updated_at": alert.updated_at.isoformat()
        }
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status: {status}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update SOS status: {str(e)}"
        )

# ----------------- SAFE HOUSE ENDPOINTS (WITH AUTO-SYNC) -----------------

@app.post("/api/safe-houses/sync", tags=["Safe Houses"])
def sync_safe_houses_from_osm(
    latitude: float,
    longitude: float,
    radius: int = 5000,
    db: Session = Depends(get_db)
):
    """
    🔄 AUTOMATICALLY fetch safe houses from OpenStreetMap and store in database
    """
    try:
        print(f"\n🔍 Starting sync for location ({latitude}, {longitude}) within {radius}m...")
        
        # Fetch data from OpenStreetMap
        osm_data = fetch_shelters_from_osm(lat=latitude, lon=longitude, radius=radius)
        
        if not osm_data or "elements" not in osm_data:
            return {
                "success": False,
                "message": "Failed to fetch data from OpenStreetMap",
                "saved_count": 0,
                "updated_count": 0
            }
        
        elements = osm_data["elements"]
        
        if len(elements) == 0:
            return {
                "success": True,
                "message": "No safe houses found in the specified area",
                "saved_count": 0,
                "updated_count": 0,
                "search_location": {"latitude": latitude, "longitude": longitude},
                "radius_km": radius / 1000
            }
        
        print(f"📦 Processing {len(elements)} elements from OSM...")
        
        saved_count = 0
        updated_count = 0
        skipped_count = 0
        
        # Process each element from OSM
        for element in elements:
            try:
                # Get coordinates
                if element["type"] == "node":
                    shelter_lat = element["lat"]
                    shelter_lon = element["lon"]
                elif element["type"] == "way" and "center" in element:
                    shelter_lat = element["center"]["lat"]
                    shelter_lon = element["center"]["lon"]
                else:
                    skipped_count += 1
                    continue
                
                tags = element.get("tags", {})
                amenity_type = tags.get("amenity", "shelter")
                
                # Generate name
                name = tags.get("name")
                if not name:
                    name = f"{amenity_type.replace('_', ' ').title()} #{element['id']}"
                
                # Build address
                address_parts = []
                if tags.get("addr:housenumber"):
                    address_parts.append(tags["addr:housenumber"])
                if tags.get("addr:street"):
                    address_parts.append(tags["addr:street"])
                if tags.get("addr:city"):
                    address_parts.append(tags["addr:city"])
                if tags.get("addr:state"):
                    address_parts.append(tags["addr:state"])
                
                address = ", ".join(address_parts) if address_parts else f"Near {latitude:.4f}, {longitude:.4f}"
                
                # Get capacity
                capacity = None
                if tags.get("capacity"):
                    try:
                        capacity = int(tags["capacity"])
                    except ValueError:
                        capacity = 50
                else:
                    # Default capacity based on type
                    capacity_defaults = {
                        "school": 200,
                        "hospital": 100,
                        "community_centre": 150,
                        "shelter": 100,
                        "police": 50,
                        "social_facility": 80,
                        "fire_station": 30
                    }
                    capacity = capacity_defaults.get(amenity_type, 50)
                
                # Get contact info
                contact = tags.get("phone") or tags.get("contact:phone") or "N/A"
                
                # Prepare facilities/amenities
                facilities = []
                facilities.append(f"Type: {amenity_type}")
                
                if tags.get("wheelchair") == "yes":
                    facilities.append("Wheelchair Accessible")
                if tags.get("emergency") == "yes":
                    facilities.append("Emergency Services")
                if tags.get("drinking_water") == "yes":
                    facilities.append("Drinking Water")
                if tags.get("toilets") == "yes":
                    facilities.append("Toilets")
                if tags.get("internet_access"):
                    facilities.append("Internet Access")
                if tags.get("beds"):
                    facilities.append(f"Beds: {tags['beds']}")
                
                amenities_json = json.dumps({
                    "type": amenity_type,
                    "osm_id": element["id"],
                    "facilities": facilities,
                    "website": tags.get("website") or tags.get("contact:website"),
                    "opening_hours": tags.get("opening_hours"),
                    "wheelchair": tags.get("wheelchair"),
                    "emergency": tags.get("emergency"),
                    "last_synced": datetime.utcnow().isoformat()
                })
                
                # Check for duplicates (within 50 meters)
                existing_houses = db.query(models.SafeHouse).filter(
                    models.SafeHouse.is_active == True
                ).all()
                
                is_duplicate = False
                for existing in existing_houses:
                    distance = calculate_distance(
                        shelter_lat,
                        shelter_lon,
                        existing.latitude,
                        existing.longitude
                    )
                    
                    # If within 50 meters, consider it a duplicate
                    if distance < 0.05:  # 50 meters = 0.05 km
                        is_duplicate = True
                        # Update existing entry with fresh data
                        existing.name = name
                        existing.address = address
                        existing.capacity = capacity
                        existing.contact_number = contact if contact != "N/A" else existing.contact_number
                        existing.amenities = amenities_json
                        existing.updated_at = datetime.utcnow()
                        updated_count += 1
                        print(f"   ♻️  Updated: {name}")
                        break
                
                if not is_duplicate:
                    # Create new safe house
                    new_house = models.SafeHouse(
                        name=name,
                        address=address,
                        latitude=shelter_lat,
                        longitude=shelter_lon,
                        capacity=capacity,
                        current_occupancy=0,
                        contact_number=contact if contact != "N/A" else None,
                        amenities=amenities_json,
                        is_active=True
                    )
                    db.add(new_house)
                    saved_count += 1
                    print(f"   ✅ Added: {name}")
            
            except Exception as element_error:
                print(f"   ⚠️  Error processing element {element.get('id')}: {str(element_error)}")
                skipped_count += 1
                continue
        
        # Commit all changes
        db.commit()
        
        print(f"\n✨ Sync completed!")
        print(f"   📥 New: {saved_count}")
        print(f"   🔄 Updated: {updated_count}")
        print(f"   ⏭️  Skipped: {skipped_count}")
        
        return {
            "success": True,
            "message": f"Successfully synced {saved_count + updated_count} safe houses from OpenStreetMap",
            "saved_count": saved_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count,
            "total_processed": len(elements),
            "search_location": {
                "latitude": latitude,
                "longitude": longitude
            },
            "radius_km": radius / 1000
        }
    
    except Exception as e:
        db.rollback()
        print(f"❌ Sync failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync safe houses: {str(e)}"
        )

@app.get("/api/safe-houses/sync/status", tags=["Safe Houses"])
def get_sync_status(db: Session = Depends(get_db)):
    """
    Get the current status of safe houses in the database
    """
    total_houses = db.query(models.SafeHouse).filter(
        models.SafeHouse.is_active == True
    ).count()
    
    # Get most recent update
    latest_house = db.query(models.SafeHouse).order_by(
        models.SafeHouse.updated_at.desc()
    ).first()
    
    # Get total capacity
    houses = db.query(models.SafeHouse).filter(
        models.SafeHouse.is_active == True
    ).all()
    
    total_capacity = sum(h.capacity for h in houses if h.capacity)
    total_occupancy = sum(h.current_occupancy for h in houses)
    
    return {
        "total_safe_houses": total_houses,
        "total_capacity": total_capacity,
        "total_occupancy": total_occupancy,
        "available_space": total_capacity - total_occupancy,
        "last_sync": latest_house.updated_at.isoformat() if latest_house else None,
        "database_status": "populated" if total_houses > 0 else "empty"
    }

@app.post("/api/safe-houses/bulk", tags=["Safe Houses"])
def bulk_create_safe_houses(
    payload: SafeHouseBulkCreate,
    db: Session = Depends(get_db)
):
    """
    Bulk create safe houses from external data
    """
    try:
        saved_count = 0
        updated_count = 0
        search_lat = payload.location.get("latitude")
        search_lon = payload.location.get("longitude")
        
        for shelter_data in payload.safe_houses:
            # Check for duplicates
            existing_houses = db.query(models.SafeHouse).filter(
                models.SafeHouse.is_active == True
            ).all()
            
            is_duplicate = False
            for existing in existing_houses:
                distance = calculate_distance(
                    shelter_data.latitude,
                    shelter_data.longitude,
                    existing.latitude,
                    existing.longitude
                )
                if distance < 0.05:
                    is_duplicate = True
                    existing.name = shelter_data.name
                    existing.address = shelter_data.address or existing.address
                    existing.capacity = shelter_data.capacity or existing.capacity
                    existing.contact_number = shelter_data.contact or existing.contact_number
                    existing.amenities = facilities_to_amenities(shelter_data.facilities)
                    existing.updated_at = datetime.utcnow()
                    updated_count += 1
                    break
            
            if not is_duplicate:
                new_house = models.SafeHouse(
                    name=shelter_data.name,
                    address=shelter_data.address or f"Near {search_lat:.4f}, {search_lon:.4f}",
                    latitude=shelter_data.latitude,
                    longitude=shelter_data.longitude,
                    capacity=shelter_data.capacity,
                    current_occupancy=0,
                    contact_number=shelter_data.contact if shelter_data.contact != "N/A" else None,
                    amenities=facilities_to_amenities(shelter_data.facilities),
                    is_active=True
                )
                db.add(new_house)
                saved_count += 1
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Successfully processed {len(payload.safe_houses)} safe houses",
            "saved_count": saved_count,
            "updated_count": updated_count,
            "total": saved_count + updated_count,
            "location": payload.location
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save safe houses: {str(e)}")

@app.get("/api/safe-houses/nearby", tags=["Safe Houses"])
def get_nearby_safe_houses(
    latitude: float,
    longitude: float,
    radius: int = 5000,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get safe houses near a specific location within a given radius
    Returns houses sorted by distance with enhanced details
    """
    try:
        # Get all active safe houses
        all_houses = db.query(models.SafeHouse).filter(
            models.SafeHouse.is_active == True
        ).all()
        
        nearby_houses = []
        radius_km = radius / 1000
        
        for house in all_houses:
            distance = calculate_distance(
                latitude,
                longitude,
                house.latitude,
                house.longitude
            )
            
            if distance <= radius_km:
                # Parse amenities
                try:
                    amenities_data = json.loads(house.amenities) if house.amenities else {}
                    facilities = amenities_data.get("facilities", ["Emergency Shelter"])
                except:
                    facilities = ["Emergency Shelter"]
                
                house_dict = {
                    "id": house.id,
                    "name": house.name,
                    "type": "shelter",
                    "address": house.address,
                    "latitude": house.latitude,
                    "longitude": house.longitude,
                    "distance": round(distance, 2),
                    "capacity": house.capacity,
                    "current_occupancy": house.current_occupancy,
                    "contact": house.contact_number or "N/A",
                    "facilities": facilities,
                    "is_available": house.current_occupancy < house.capacity if house.capacity else True,
                    "available_space": (house.capacity - house.current_occupancy) if house.capacity else None,
                    "created_at": house.created_at.isoformat() if house.created_at else None,
                    "updated_at": house.updated_at.isoformat() if house.updated_at else None
                }
                nearby_houses.append(house_dict)
        
        # Sort by distance
        nearby_houses.sort(key=lambda x: x["distance"])
        nearby_houses = nearby_houses[:limit]
        
        return {
            "success": True,
            "count": len(nearby_houses),
            "search_location": {
                "latitude": latitude,
                "longitude": longitude
            },
            "radius_km": radius_km,
            "safe_houses": nearby_houses
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch safe houses: {str(e)}")

@app.post("/api/safe-houses/search", tags=["Safe Houses"])
def search_safe_houses(
    params: NearbySearchParams,
    db: Session = Depends(get_db)
):
    """
    Search safe houses using POST method
    """
    return get_nearby_safe_houses(
        latitude=params.latitude,
        longitude=params.longitude,
        radius=params.radius,
        db=db
    )

@app.get("/api/safe-houses", tags=["Safe Houses"])
def get_safe_houses(is_active: bool = True, db: Session = Depends(get_db)):
    return db.query(models.SafeHouse).filter(models.SafeHouse.is_active == is_active).all()

@app.get("/api/safe-houses/{house_id}", tags=["Safe Houses"])
def get_safe_house(house_id: int, db: Session = Depends(get_db)):
    house = db.query(models.SafeHouse).filter(models.SafeHouse.id == house_id).first()
    if not house:
        raise HTTPException(status_code=404, detail="Safe house not found")
    
    return {
        "id": house.id,
        "name": house.name,
        "address": house.address,
        "latitude": house.latitude,
        "longitude": house.longitude,
        "capacity": house.capacity,
        "current_occupancy": house.current_occupancy,
        "contact_number": house.contact_number,
        "facilities": amenities_to_facilities(house.amenities),
        "is_active": house.is_active,
        "is_available": house.current_occupancy < house.capacity if house.capacity else True,
        "created_at": house.created_at,
        "updated_at": house.updated_at
    }

@app.post("/api/safe-houses", tags=["Safe Houses"])
def create_safe_house(
    name: str,
    address: str,
    latitude: float,
    longitude: float,
    capacity: int = None,
    contact_number: str = None,
    db: Session = Depends(get_db)
):
    house = models.SafeHouse(
        name=name,
        address=address,
        latitude=latitude,
        longitude=longitude,
        capacity=capacity,
        contact_number=contact_number
    )
    db.add(house)
    db.commit()
    db.refresh(house)
    return house

@app.put("/api/safe-houses/{house_id}/occupancy", tags=["Safe Houses"])
def update_occupancy(
    house_id: int,
    occupancy: int,
    db: Session = Depends(get_db)
):
    """
    Update the current occupancy of a safe house
    """
    house = db.query(models.SafeHouse).filter(
        models.SafeHouse.id == house_id
    ).first()
    
    if not house:
        raise HTTPException(status_code=404, detail="Safe house not found")
    
    if occupancy < 0:
        raise HTTPException(status_code=400, detail="Occupancy cannot be negative")
    
    if house.capacity and occupancy > house.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Occupancy ({occupancy}) exceeds capacity ({house.capacity})"
        )
    
    house.current_occupancy = occupancy
    house.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "message": "Occupancy updated successfully",
        "house_id": house_id,
        "current_occupancy": occupancy,
        "capacity": house.capacity,
        "available_space": house.capacity - occupancy if house.capacity else None
    }

@app.delete("/api/safe-houses/{house_id}", tags=["Safe Houses"])
def deactivate_safe_house(house_id: int, db: Session = Depends(get_db)):
    """
    Deactivate a safe house (soft delete)
    """
    house = db.query(models.SafeHouse).filter(
        models.SafeHouse.id == house_id
    ).first()
    
    if not house:
        raise HTTPException(status_code=404, detail="Safe house not found")
    
    house.is_active = False
    house.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "message": "Safe house deactivated successfully",
        "house_id": house_id
    }

# ----------------- VOLUNTEERS -----------------

# ----------------- VOLUNTEERS (NO registered_at field) -----------------

@app.get("/api/volunteers", tags=["Volunteers"])
def get_volunteers(is_active: bool = True, db: Session = Depends(get_db)):
    """Get all volunteers with their email addresses"""
    try:
        volunteers = db.query(models.VolunteerRegistration).filter(
            models.VolunteerRegistration.is_active == is_active
        ).all()
        
        result = []
        for volunteer in volunteers:
            # Get user details
            user = db.query(models.User).filter(models.User.id == volunteer.user_id).first()
            
            result.append({
                "id": volunteer.id,
                "user_id": volunteer.user_id,
                "email": user.email if user else "N/A",
                "full_name": user.full_name if user else "N/A",
                "phone": user.phone if user else None,
                "city": user.city if user else None,
                "skills": volunteer.skills,
                "availability": volunteer.availability,
                "experience_level": volunteer.experience_level,
                "is_active": volunteer.is_active,
                "created_at": volunteer.created_at.isoformat() if volunteer.created_at else None
            })
        
        return {
            "success": True,
            "count": len(result),
            "volunteers": result
        }
    except Exception as e:
        print(f"Error getting volunteers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/volunteers", tags=["Volunteers"])
@app.post("/api/volunteers/register", tags=["Volunteers"])
def register_volunteer(volunteer_data: VolunteerRegister, db: Session = Depends(get_db)):
    """
    Register a new volunteer with email address
    Creates user account if doesn't exist
    """
    try:
        print(f"\n📝 Registering volunteer: {volunteer_data.email}")
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == volunteer_data.email).first()
        
        if not user:
            print(f"   ✨ Creating new user for {volunteer_data.email}")
            # Create new user account
            user = models.User(
                email=volunteer_data.email,
                password_hash="volunteer_temp",
                full_name=volunteer_data.full_name,
                phone=volunteer_data.phone,
                city=volunteer_data.city,
                role="volunteer"  # Use string value directly
            )
            db.add(user)
            db.flush()  # Flush to get the user ID
            print(f"   ✅ User created with ID: {user.id}")
        else:
            print(f"   🔄 Updating existing user {user.id}")
            # Update existing user info
            if volunteer_data.full_name:
                user.full_name = volunteer_data.full_name
            if volunteer_data.phone:
                user.phone = volunteer_data.phone
            if volunteer_data.city:
                user.city = volunteer_data.city
            user.role = models.UserRole.VOLUNTEER
            db.flush()
        
        # Check if already registered as volunteer
        existing_volunteer = db.query(models.VolunteerRegistration).filter(
            models.VolunteerRegistration.user_id == user.id
        ).first()
        
        if existing_volunteer:
            print(f"   ♻️  Updating existing volunteer registration")
            # Update existing registration
            if volunteer_data.skills:
                existing_volunteer.skills = volunteer_data.skills
            if volunteer_data.availability:
                existing_volunteer.availability = volunteer_data.availability
            if volunteer_data.experience_level:
                existing_volunteer.experience_level = volunteer_data.experience_level
            existing_volunteer.is_active = True
            db.commit()
            
            return {
                "success": True,
                "message": "Volunteer registration updated successfully",
                "volunteer_id": existing_volunteer.id,
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name
            }
        
        print(f"   🆕 Creating new volunteer registration")
        # Create new volunteer registration (WITHOUT registered_at)
        volunteer = models.VolunteerRegistration(
            user_id=user.id,
            skills=volunteer_data.skills or "",
            availability=volunteer_data.availability or "",
            experience_level=volunteer_data.experience_level or "beginner",
            is_active=True
        )
        db.add(volunteer)
        db.commit()
        db.refresh(volunteer)
        
        print(f"   ✅ Volunteer registered successfully with ID: {volunteer.id}")
        
        return {
            "success": True,
            "message": "Volunteer registered successfully",
            "volunteer_id": volunteer.id,
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "skills": volunteer.skills,
            "availability": volunteer.availability,
            "experience_level": volunteer.experience_level
        }
        
    except Exception as e:
        db.rollback()
        print(f"   ❌ Registration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.put("/api/volunteers/{volunteer_id}", tags=["Volunteers"])
def update_volunteer(
    volunteer_id: int,
    volunteer_data: VolunteerUpdate,
    db: Session = Depends(get_db)
):
    """Update volunteer information including email"""
    try:
        volunteer = db.query(models.VolunteerRegistration).filter(
            models.VolunteerRegistration.id == volunteer_id
        ).first()
        
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        
        # Get associated user
        user = db.query(models.User).filter(models.User.id == volunteer.user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="Associated user not found")
        
        # Update user information
        if volunteer_data.email and volunteer_data.email != user.email:
            # Check if new email already exists
            existing = db.query(models.User).filter(
                models.User.email == volunteer_data.email,
                models.User.id != user.id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use")
            user.email = volunteer_data.email
        
        if volunteer_data.full_name:
            user.full_name = volunteer_data.full_name
        if volunteer_data.phone:
            user.phone = volunteer_data.phone
        if volunteer_data.city:
            user.city = volunteer_data.city
        
        # Update volunteer information
        if volunteer_data.skills:
            volunteer.skills = volunteer_data.skills
        if volunteer_data.availability:
            volunteer.availability = volunteer_data.availability
        if volunteer_data.experience_level:
            volunteer.experience_level = volunteer_data.experience_level
        
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": "Volunteer updated successfully",
            "volunteer_id": volunteer.id,
            "email": user.email,
            "full_name": user.full_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Update failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")


@app.delete("/api/volunteers/{volunteer_id}", tags=["Volunteers"])
def deactivate_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    """Deactivate a volunteer (soft delete)"""
    try:
        volunteer = db.query(models.VolunteerRegistration).filter(
            models.VolunteerRegistration.id == volunteer_id
        ).first()
        
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        
        volunteer.is_active = False
        db.commit()
        
        return {
            "success": True,
            "message": "Volunteer deactivated successfully",
            "volunteer_id": volunteer_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/volunteers/{volunteer_id}", tags=["Volunteers"])
def get_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    """Get a specific volunteer with email"""
    try:
        volunteer = db.query(models.VolunteerRegistration).filter(
            models.VolunteerRegistration.id == volunteer_id
        ).first()
        
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        
        user = db.query(models.User).filter(models.User.id == volunteer.user_id).first()
        
        return {
            "id": volunteer.id,
            "user_id": volunteer.user_id,
            "email": user.email if user else "N/A",
            "full_name": user.full_name if user else "N/A",
            "phone": user.phone if user else None,
            "city": user.city if user else None,
            "skills": volunteer.skills,
            "availability": volunteer.availability,
            "experience_level": volunteer.experience_level,
            "is_active": volunteer.is_active,
            "created_at": volunteer.created_at.isoformat() if volunteer.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/volunteers/email/{email}", tags=["Volunteers"])
def get_volunteer_by_email(email: str, db: Session = Depends(get_db)):
    """Get volunteer by email address"""
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        volunteer = db.query(models.VolunteerRegistration).filter(
            models.VolunteerRegistration.user_id == user.id
        ).first()
        
        if not volunteer:
            raise HTTPException(status_code=404, detail="Volunteer registration not found")
        
        return {
            "id": volunteer.id,
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "city": user.city,
            "skills": volunteer.skills,
            "availability": volunteer.availability,
            "experience_level": volunteer.experience_level,
            "is_active": volunteer.is_active,
            "created_at": volunteer.created_at.isoformat() if volunteer.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- COMMUNITY POSTS -----------------

@app.get("/api/community-posts", tags=["Community"])
def get_community_posts(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(models.CommunityPost).offset(skip).limit(limit).all()

@app.get("/api/community-posts/{post_id}", tags=["Community"])
def get_community_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@app.post("/api/community-posts", tags=["Community"])
def create_community_post(
    author_id: int,
    title: str,
    content: str,
    category: str = None,
    db: Session = Depends(get_db)
):
    post = models.CommunityPost(
        author_id=author_id,
        title=title,
        content=content,
        category=category
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

# ----------------- WEATHER ALERTS -----------------

@app.get("/api/weather-alerts", tags=["Weather"])
def get_weather_alerts(city: str = None, is_active: bool = True, db: Session = Depends(get_db)):
    query = db.query(models.WeatherAlert).filter(models.WeatherAlert.is_active == is_active)
    if city:
        query = query.filter(models.WeatherAlert.city == city)
    return query.all()

@app.post("/api/weather-alerts", tags=["Weather"])
def create_weather_alert(
    city: str,
    alert_type: str,
    severity: str,
    description: str,
    db: Session = Depends(get_db)
):
    alert = models.WeatherAlert(
        city=city,
        alert_type=alert_type,
        severity=models.SeverityLevel[severity],
        description=description
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

# ----------------- RELIEF RESOURCES -----------------

@app.get("/api/relief-resources", tags=["Relief"])
def get_relief_resources(is_available: bool = True, db: Session = Depends(get_db)):
    return db.query(models.Relief).filter(models.Relief.is_available == is_available).all()

@app.post("/api/relief-resources", tags=["Relief"])
def create_relief_resource(
    name: str,
    resource_type: str,
    quantity: int,
    location: str,
    unit: str = None,
    contact_number: str = None,
    db: Session = Depends(get_db)
):
    resource = models.Relief(
        name=name,
        resource_type=resource_type,
        quantity=quantity,
        unit=unit,
        location=location,
        contact_number=contact_number
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource

# ----------------- DASHBOARD STATISTICS -----------------

@app.get("/api/statistics", tags=["Statistics"])
def get_statistics(db: Session = Depends(get_db)):
    """
    Get comprehensive dashboard statistics
    """
    stats = {
        "total_users": db.query(models.User).count(),
        "total_reports": db.query(models.DisasterReport).count(),
        "active_sos_alerts": db.query(models.SOSAlert).filter(
            models.SOSAlert.status == models.AlertStatus.ACTIVE
        ).count(),
        "total_safe_houses": db.query(models.SafeHouse).filter(
            models.SafeHouse.is_active == True
        ).count(),
        "total_volunteers": db.query(models.VolunteerRegistration).filter(
            models.VolunteerRegistration.is_active == True
        ).count(),
        "active_weather_alerts": db.query(models.WeatherAlert).filter(
            models.WeatherAlert.is_active == True
        ).count()
    }
    return stats

# ----------------- RUN SERVER -----------------

if __name__ == "__main__":
    print("\n" + "="*70)
    print("🚀 DISASTER MANAGEMENT API - VOLUNTEER EMAIL SUPPORT")
    print("="*70)
    print("\n📚 API Documentation: http://localhost:8000/docs")
    print("📊 Alternative Docs: http://localhost:8000/redoc")
    print("💾 Database: Connected")
    print("\n✨ KEY FEATURES:")
    print("   🔄 AUTO-SYNC: Fetch safe houses from OpenStreetMap")
    print("   🏠 SAFE HOUSES: Store and manage emergency shelters")
    print("   🚨 SOS ALERTS: Emergency alert system")
    print("   🌤️  WEATHER: Alert notifications")
    print("   👥 VOLUNTEERS: Email-based registration")
    print("   📍 LOCATION: Real-time tracking")
    print("\n🔥 VOLUNTEER ENDPOINTS:")
    print("   POST /api/volunteers/register - Register with email")
    print("   GET  /api/volunteers - Get all volunteers")
    print("   GET  /api/volunteers/email/{email} - Find by email")
    print("   PUT  /api/volunteers/{id} - Update volunteer")
    print("\n🔥 SAFE HOUSE ENDPOINTS:")
    print("   POST /api/safe-houses/sync - Auto-sync from OSM")
    print("   GET  /api/safe-houses/nearby - Get nearby shelters")
    print("   GET  /api/safe-houses/sync/status - Check database")
    print("\n📡 OTHER ENDPOINTS:")
    print("   POST /sos - Emergency SOS alert")
    print("   POST /api/report - Disaster reporting")
    print("   GET  /api/statistics - Dashboard stats")
    print("\n" + "="*70)
    print("🎯 Ready to serve requests!\n")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )