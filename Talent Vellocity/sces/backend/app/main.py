from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, SessionLocal
from app.models.models import Base
from app.routes import auth, profile, admin, projects

Base.metadata.create_all(bind=engine)

# Seed default admin on first run
def seed_admin():
    from app.models.models import User
    from app.services.auth_service import hash_password
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(
                username="admin",
                email="admin@codetracker.local",
                hashed_password=hash_password("admin123"),
                role="admin",
                profile_setup_done=1,
            ))
            db.commit()
    finally:
        db.close()

seed_admin()

app = FastAPI(title="Coding Profile Tracker", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(admin.router)
app.include_router(projects.router)


@app.get("/")
def root():
    return {"message": "Coding Profile Tracker API v3.0"}
