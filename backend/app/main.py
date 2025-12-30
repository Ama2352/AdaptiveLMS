from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, student, engine

app = FastAPI(title="Adaptive Engine API (Modular)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, tags=["auth"])
app.include_router(student.router, tags=["student"])
app.include_router(engine.router, tags=["engine"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Adaptive Engine API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
