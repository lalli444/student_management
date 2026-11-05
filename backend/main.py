from fastapi import FastAPI, HTTPException, Path, Query, Depends
from pydantic import BaseModel, field_validator, computed_field, Field, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from typing import List, Dict, Any
import os

from .database import engine, Base, get_db
from .models import StudentModel
from .seed import seed_database_from_json


# Ensure tables exist and database is seeded
Base.metadata.create_all(bind=engine)
seed_database_from_json()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist and database is seeded on server boot
    Base.metadata.create_all(bind=engine)
    seed_database_from_json()
    yield


app = FastAPI(
    title="Student Management System API",
    description="Production-ready FastAPI backend with PostgreSQL persistence, CRUD, sorting, and pagination.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Cross-Origin Resource Sharing Configuration
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env.strip():
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
    allow_credentials = True
else:
    # Development defaults
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper: Calculate grade based on marks
def calculate_grade(marks: int) -> str:
    if marks >= 90:
        return "A+"
    elif marks >= 80:
        return "A"
    elif marks >= 70:
        return "B"
    elif marks >= 60:
        return "C"
    else:
        return "F"


# Pydantic Schemas
class Student(BaseModel):
    id: str = Field(..., min_length=2, max_length=50, examples=["S001"])
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., gt=0, le=100)
    course: str = Field(..., min_length=2, max_length=100)
    marks: int = Field(..., ge=0, le=100)
    email: EmailStr

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str):
        cleaned = value.strip()
        if not cleaned.replace(" ", "").isalpha():
            raise ValueError("Name must contain only letters and spaces")
        return cleaned.title()

    @computed_field
    @property
    def grade(self) -> str:
        return calculate_grade(self.marks)


class StudentUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    age: int | None = Field(None, gt=0, le=100)
    course: str | None = Field(None, min_length=2, max_length=100)
    marks: int | None = Field(None, ge=0, le=100)
    email: EmailStr | None = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str | None):
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned.replace(" ", "").isalpha():
            raise ValueError("Name must contain only letters and spaces")
        return cleaned.title()


# Endpoints
@app.get('/')
def root():
    return {
        "status": "online",
        "message": "Welcome to Student Management System API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get('/hello')
def hello():
    return {"message": "Student Management API is running smoothly"}


@app.get('/student')
def get_all_students(db: Session = Depends(get_db)):
    students = db.query(StudentModel).all()
    return {s.id: s.to_dict() for s in students}


@app.get("/students/{student_id}")
def get_student_by_id(
    student_id: str = Path(..., description="The Id of the student", examples=["S001"]),
    db: Session = Depends(get_db)
):
    student = db.query(StudentModel).filter(StudentModel.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail=f"Student with Id '{student_id}' not found"
        )
    return student.to_dict()


@app.get('/filter')
def filter_student(
    course: str | None = Query(None, description="Show only students in this course", examples=["Python"]),
    db: Session = Depends(get_db)
):
    query = db.query(StudentModel)
    if course:
        query = query.filter(StudentModel.course.ilike(course.strip()))
    students = query.all()
    return {s.id: s.to_dict() for s in students}


SORT_FIELDS = ["marks", "age", "name", "id"]
SORT_ORDER = ["asc", "desc"]


@app.get('/sort')
def sort_students(
    sort_by: str = Query("marks", description="Sort by marks, name, age, or id", examples=["marks"]),
    order: str = Query("asc", description="asc or desc", examples=["asc", "desc"]),
    db: Session = Depends(get_db)
):
    if sort_by not in SORT_FIELDS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort_by '{sort_by}'. Choose from {SORT_FIELDS}"
        )

    if order not in SORT_ORDER:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid order '{order}'. Choose from {SORT_ORDER}"
        )

    column = getattr(StudentModel, sort_by)
    direction = desc(column) if order == "desc" else asc(column)

    students = db.query(StudentModel).order_by(direction).all()
    return [s.to_dict() for s in students]


@app.get("/paginate")
def paginate_student(
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    limit: int = Query(10, ge=1, le=100, description="Items per page (1 to 100)"),
    db: Session = Depends(get_db)
):
    total_students = db.query(StudentModel).count()
    offset = (page - 1) * limit

    students = db.query(StudentModel).offset(offset).limit(limit).all()

    return {
        "page": page,
        "limit": limit,
        "total_students": total_students,
        "total_pages": (total_students + limit - 1) // limit if total_students > 0 else 1,
        "students": [s.to_dict() for s in students]
    }


@app.post('/create', status_code=201)
def create_student(student: Student, db: Session = Depends(get_db)):
    existing = db.query(StudentModel).filter(StudentModel.id == student.id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Student with Id '{student.id}' already exists"
        )

    new_record = StudentModel(
        id=student.id,
        name=student.name,
        age=student.age,
        course=student.course,
        marks=student.marks,
        email=student.email
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return {
        "message": "Student created successfully",
        "student": new_record.to_dict()
    }


@app.put("/update/{student_id}")
def update_student(
    student_update: StudentUpdate,
    student_id: str = Path(..., description="The Id of the student", examples=["S001"]),
    db: Session = Depends(get_db)
):
    student_record = db.query(StudentModel).filter(StudentModel.id == student_id).first()
    if not student_record:
        raise HTTPException(
            status_code=404,
            detail=f"Student with Id '{student_id}' not found"
        )

    update_dict = student_update.model_dump(exclude_unset=True)

    for field, value in update_dict.items():
        setattr(student_record, field, value)

    db.commit()
    db.refresh(student_record)

    return {
        "message": "Student updated successfully",
        "student": student_record.to_dict()
    }


@app.delete('/delete/{student_id}')
def delete_student(
    student_id: str = Path(..., description="The Id of the student", examples=["S001"]),
    db: Session = Depends(get_db)
):
    student_record = db.query(StudentModel).filter(StudentModel.id == student_id).first()
    if not student_record:
        raise HTTPException(
            status_code=404,
            detail=f"Student with Id '{student_id}' not found"
        )

    deleted_dict = student_record.to_dict()
    db.delete(student_record)
    db.commit()

    return {
        "message": f"Student '{student_id}' deleted successfully",
        "deleted_student": deleted_dict
    }
