from sqlalchemy import Column, String, Integer
from .database import Base

class StudentModel(Base):
    __tablename__ = "students"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    course = Column(String(100), nullable=False)
    marks = Column(Integer, nullable=False)
    email = Column(String(150), nullable=False)

    def calculate_grade(self) -> str:
        if self.marks >= 90:
            return "A+"
        elif self.marks >= 80:
            return "A"
        elif self.marks >= 70:
            return "B"
        elif self.marks >= 60:
            return "C"
        else:
            return "F"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "course": self.course,
            "marks": self.marks,
            "email": self.email,
            "grade": self.calculate_grade()
        }
