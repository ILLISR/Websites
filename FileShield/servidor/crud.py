from schemas import UserCreate
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import User, SearchHistory

async def create_user(db: AsyncSession, user: UserCreate):
    db_user = User(email=user.email, name=user.name, image=user.image)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def create_search_history(db: AsyncSession, user_id: int, file_name: str, analysis_result: dict):
    search_history = SearchHistory(user_id=user_id, file_name=file_name, analysis_result=analysis_result)
    db.add(search_history)
    await db.commit()
    await db.refresh(search_history)
    return search_history
