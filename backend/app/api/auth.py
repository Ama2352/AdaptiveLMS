from fastapi import APIRouter
from ..models.auth import LoginRequest, LoginResponse

router = APIRouter()

# --- AUTH SIMULATION ---
# Email -> (UUID, Role)
DEMO_USERS = {
    "gioi_deu@test.com": ("00000000-0000-0000-0000-000000000001", "student"),
    "yeu_deu@test.com": ("00000000-0000-0000-0000-000000000002", "student"),
    "yeu_hamso@test.com": ("00000000-0000-0000-0000-000000000003", "student"),
    "teacher@test.com": ("00000000-0000-0000-0000-000000000004", "teacher"),
}

@router.post("/login", response_model=LoginResponse)
def login_endpoint(payload: LoginRequest):
    user_data = DEMO_USERS.get(payload.email)
    
    if user_data and payload.password: # Any password works for demo
        uid, role = user_data
        return LoginResponse(status="success", student_id=uid, role=role)
        
    return LoginResponse(status="error", message="Invalid credentials")
