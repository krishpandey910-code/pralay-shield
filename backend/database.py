from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Root%40123@localhost/disaster_management")

# MySQL-specific engine configuration
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production for better performance
    pool_pre_ping=True,  # Verify connections are alive before using
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Additional connections when pool is full
    connect_args={
        "charset": "utf8mb4",  # Support emojis and special characters
        "connect_timeout": 30  # Connection timeout in seconds
    }
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency for FastAPI routes
def get_db():
    """
    Database session dependency for FastAPI.
    Usage: def route(db: Session = Depends(get_db))
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to create all tables
def create_tables():
    """
    Create all database tables.
    Import your models before calling this function.
    """
    from databasemodels import Base as ModelsBase
    ModelsBase.metadata.create_all(bind=engine)
    print("✅ All database tables created successfully!")

# Function to drop all tables (use with caution!)
def drop_tables():
    """
    Drop all database tables.
    WARNING: This will delete all data!
    """
    from databasemodels import Base as ModelsBase
    ModelsBase.metadata.drop_all(bind=engine)
    print("⚠️ All database tables dropped!")

# Test database connection
def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as connection:
            print("✅ Database connection successful!")
            print(f"📊 Database URL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    # Test database connection
    try:
        with engine.connect() as connection:
            print("✅ Database connection successful!")
            print(f"📊 Database URL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")