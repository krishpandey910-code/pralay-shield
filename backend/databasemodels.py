from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship, sessionmaker, declarative_base
from datetime import datetime
import enum
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL (change according to your setup)
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://disaster_user:password@localhost/disaster_management")

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============= ENUMS =============
# Use lowercase values to match MySQL database
class UserRole(str, enum.Enum):
    CIVILIAN = "civilian"      # Python: CIVILIAN, Database: 'civilian'
    RESPONDER = "responder"    # Python: RESPONDER, Database: 'responder'
    ADMIN = "admin"            # Python: ADMIN, Database: 'admin'
    VOLUNTEER = "volunteer"    # Python: VOLUNTEER, Database: 'volunteer'

class DisasterType(str, enum.Enum):
    EARTHQUAKE = "earthquake"
    FLOOD = "flood"
    WILDFIRE = "wildfire"
    HURRICANE = "hurricane"
    TORNADO = "tornado"
    LANDSLIDE = "landslide"
    OTHER = "other"

class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    RESPONDING = "responding"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"

# ============= MODELS =============

# 1. Users Table
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    # Use native_enum=False to handle the enum as strings
    role = Column(String(20), default="civilian")  # Changed to String to avoid enum issues
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    city = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reports = relationship("DisasterReport", foreign_keys="DisasterReport.reporter_id", back_populates="reporter")
    sos_alerts = relationship("SOSAlert", foreign_keys="SOSAlert.user_id", back_populates="user")
    weather_registrations = relationship("WeatherRegistration", back_populates="user")
    community_posts = relationship("CommunityPost", back_populates="author")
    volunteer_registrations = relationship("VolunteerRegistration", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

# 2. Disaster Reports Table
class DisasterReport(Base):
    __tablename__ = "disaster_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    disaster_type = Column(String(50), nullable=False)  # Changed to String
    severity = Column(String(20), default="medium")     # Changed to String
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    photo_url = Column(String(500), nullable=True)
    voice_note_url = Column(String(500), nullable=True)
    affected_people = Column(Integer, nullable=True)
    status = Column(String(50), default="pending")
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports")
    verified_admin = relationship("User", foreign_keys=[verified_by])

# 3. SOS Alerts Table
class SOSAlert(Base):
    __tablename__ = "sos_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    emergency_type = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="active")  # Changed to String
    responder_assigned_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="sos_alerts")
    responder = relationship("User", foreign_keys=[responder_assigned_id])

# 4. Weather Alerts Registration Table
class WeatherRegistration(Base):
    __tablename__ = "weather_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    email = Column(String(255), nullable=False)
    city = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    notification_preference = Column(String(50), default="email")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="weather_registrations")

# 5. Safe Houses/Shelters Table
class SafeHouse(Base):
    __tablename__ = "safe_houses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=True)
    current_occupancy = Column(Integer, default=0)
    contact_number = Column(String(20), nullable=True)
    amenities = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 6. Community Posts Table
class CommunityPost(Base):
    __tablename__ = "community_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=True)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = relationship("User", back_populates="community_posts")
    comments = relationship("CommunityComment", back_populates="post")

# 7. Community Comments Table
class CommunityComment(Base):
    __tablename__ = "community_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    post = relationship("CommunityPost", back_populates="comments")
    author = relationship("User")

# 8. Weather Alerts Table
class WeatherAlert(Base):
    __tablename__ = "weather_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    city = Column(String(255), nullable=False)
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)  # Changed to String
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    affected_area = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

# 9. Notifications Table
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    related_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notifications")

# 10. Resources/Relief Table
class Relief(Base):
    __tablename__ = "relief_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    resource_type = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit = Column(String(50), nullable=True)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    contact_person = Column(String(255), nullable=True)
    contact_number = Column(String(20), nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 11. Volunteer Registrations Table
class VolunteerRegistration(Base):
    __tablename__ = "volunteer_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skills = Column(Text, nullable=True)
    availability = Column(String(100), nullable=True)
    experience_level = Column(String(50), nullable=True)
    certification = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="volunteer_registrations")

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_tables()
    print("✅ Database tables created successfully!")