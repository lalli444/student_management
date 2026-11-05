import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Determine Base Directory
BASE_DIR = Path(__file__).resolve().parent

# Read DATABASE_URL from environment
# Cloud providers like Render often provide 'postgres://', but SQLAlchemy 1.4+ requires 'postgresql://'
raw_db_url = os.getenv("DATABASE_URL", "").strip()

if raw_db_url:
    if raw_db_url.startswith("postgres://"):
        DATABASE_URL = raw_db_url.replace("postgres://", "postgresql://", 1)
    else:
        DATABASE_URL = raw_db_url
    # PostgreSQL engine
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    # Default to local SQLite database when no PostgreSQL instance is configured
    SQLITE_PATH = BASE_DIR / "students.db"
    DATABASE_URL = f"sqlite:///{SQLITE_PATH}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides a database session per request and closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
