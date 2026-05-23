from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.orders import checkout as checkout_controller
from controllers.orders import get_user_orders
from database import get_db
from dependencies import get_current_user
from models import User
from schemas import OrderResponse

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def checkout(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        order = await checkout_controller(db, current_user)
        return order
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_user_orders(db, current_user)
