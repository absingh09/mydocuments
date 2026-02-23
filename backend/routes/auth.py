from fastapi import APIRouter, HTTPException, status
from database import get_users_collection
from models import UserRegister, UserLogin, Token
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    users = get_users_collection()

    # Check if email already exists
    existing = await users.find_one({"email": user.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Create user document
    new_user = {
        "name": user.name.strip(),
        "email": user.email.lower(),
        "password": hash_password(user.password),
    }
    result = await users.insert_one(new_user)
    user_id = str(result.inserted_id)

    token = create_access_token(
        {"sub": user_id, "email": user.email.lower(), "name": user.name.strip()}
    )
    return Token(access_token=token, user_name=user.name.strip(), user_email=user.email.lower())


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    users = get_users_collection()

    db_user = await users.find_one({"email": credentials.email.lower()})
    if not db_user or not verify_password(credentials.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    user_id = str(db_user["_id"])
    token = create_access_token(
        {"sub": user_id, "email": db_user["email"], "name": db_user["name"]}
    )
    return Token(access_token=token, user_name=db_user["name"], user_email=db_user["email"])
