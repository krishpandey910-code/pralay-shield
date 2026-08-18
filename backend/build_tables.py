from database import engine
import databasemodels as models

print("Building database tables...")
models.Base.metadata.create_all(bind=engine)
print("Tables built successfully!")