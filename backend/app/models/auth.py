from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    status: str
    student_id: Optional[str] = None
    role: Optional[str] = None
    message: Optional[str] = None
