import json
from pathlib import Path
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import StudentModel

BASE_DIR = Path(__file__).resolve().parent
JSON_FILE = BASE_DIR / "student.json"

def seed_database_from_json():
    """Initializes tables and migrates records from student.json if database table is empty."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        count = db.query(StudentModel).count()
        if count == 0 and JSON_FILE.exists():
            print(f"Database is empty. Migrating records from {JSON_FILE.name}...")
            with open(JSON_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            for student_id, info in data.items():
                student_record = StudentModel(
                    id=student_id,
                    name=info.get("name", "").strip().title(),
                    age=int(info.get("age", 20)),
                    course=info.get("course", "General").strip(),
                    marks=int(info.get("marks", 0)),
                    email=info.get("email", f"{student_id.lower()}@example.com").strip()
                )
                db.add(student_record)
            db.commit()
            print(f"Successfully migrated {len(data)} student records to the database.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database_from_json()
