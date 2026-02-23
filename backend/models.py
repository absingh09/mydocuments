from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ── Auth Models ──────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    user_email: str


# ── Document Models ───────────────────────────────────────────
class DocumentCreate(BaseModel):
    name: str
    issuer: Optional[str] = ""
    date: Optional[str] = ""
    file_type: str          # MIME type e.g. "application/pdf"
    filename: str
    data: str               # base64 encoded file content


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    date: Optional[str] = None


class DocumentOut(BaseModel):
    id: str
    name: str
    issuer: Optional[str] = ""
    date: Optional[str] = ""
    file_type: str
    filename: str
    data: Optional[str] = None   # only populated on single-doc fetch
    uploaded_at: Optional[str] = None
