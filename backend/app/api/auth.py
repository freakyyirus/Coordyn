"""Authentication routes and user identity dependencies."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.models.database import User, get_db
from app.models.schemas import (
    AuthTokenResponse,
    LoginRequest,
    SignUpRequest,
    TokenRefreshRequest,
    UserOut,
)
from app.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    token = credentials.credentials
    try:
        email = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def require_role(allowed_roles: List[str]):
    """Dependency factory for role-based authorization."""

    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role: {allowed_roles}",
            )
        return user

    return role_checker


@router.post("/signup", response_model=AuthTokenResponse)
async def signup(payload: SignUpRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        company=payload.company,
        use_case=payload.use_case,
        role="user",  # Default role
        is_active=True,
    )
    db.add(user)
    db.commit()

    token = create_access_token(subject=user.email)
    return AuthTokenResponse(access_token=token)


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")

    token = create_access_token(subject=user.email)
    return AuthTokenResponse(access_token=token)


@router.post("/refresh", response_model=AuthTokenResponse)
async def refresh_token(
    payload: TokenRefreshRequest,
    db: Session = Depends(get_db),
):
    """Refresh an access token using a valid refresh token."""
    try:
        email = decode_access_token(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access_token = create_access_token(subject=user.email)
    return AuthTokenResponse(access_token=new_access_token)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        company=user.company,
        use_case=user.use_case,
        role=user.role,
        is_active=user.is_active,
    )
