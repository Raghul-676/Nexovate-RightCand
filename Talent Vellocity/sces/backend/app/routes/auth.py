from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserRegister, UserLogin, Token, UserOut
from app.services.auth_service import hash_password, verify_password, create_token, get_current_user, require_admin

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(
        (User.username == body.username) | (User.email == body.email)
    ).first():
        raise HTTPException(400, "Username or email already exists")
    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        role="student",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/create-admin", response_model=UserOut, status_code=201)
def create_admin(body: UserRegister, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(User).filter(
        (User.username == body.username) | (User.email == body.email)
    ).first():
        raise HTTPException(400, "Username or email already exists")
    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        role="admin",
        profile_setup_done=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    token = create_token({"sub": user.username})
    return Token(
        access_token=token,
        username=user.username,
        role=user.role,
        profile_setup_done=bool(user.profile_setup_done),
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
