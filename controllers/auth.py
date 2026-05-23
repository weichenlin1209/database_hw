from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import hash_password, verify_password, create_access_token
from models import User
from schemas import UserRegister, UserLogin


async def register_user(db: AsyncSession, data: UserRegister) -> User:
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise ValueError("Username already taken")

    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        role="customer",
    )
    db.add(user)
    await db.flush()
    return user


async def login_user(db: AsyncSession, data: UserLogin) -> str:
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise ValueError("Invalid username or password")

    return create_access_token({"user_id": user.user_id, "role": user.role, "username": user.username})
