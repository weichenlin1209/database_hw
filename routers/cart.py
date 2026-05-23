from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from controllers.cart import add_item_to_cart, get_cart, remove_cart_item, update_cart_item
from database import get_db
from dependencies import get_current_user
from models import CartItem, User
from schemas import CartItemCreate, CartItemUpdate, CartResponse

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartResponse)
async def view_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cart = await get_cart(db, current_user)
    items_result = await db.execute(
        select(CartItem)
        .where(CartItem.cart_id == cart.cart_id)
        .options(selectinload(CartItem.product))
    )
    cart_items = list(items_result.scalars().all())
    formatted_items = []
    total_price = 0.0
    for ci in cart_items:
        price = float(ci.product.price)
        item_total = price * ci.quantity
        total_price += item_total
        formatted_items.append({
            "cart_item_id": ci.cart_item_id,
            "product_id": ci.product_id,
            "name": ci.product.name,
            "price": price,
            "quantity": ci.quantity,
            "total": item_total,
        })
    return CartResponse(cart_id=cart.cart_id, items=formatted_items, total_price=total_price)


@router.post("/items", status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    data: CartItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        await add_item_to_cart(db, current_user, data.product_id, data.quantity)
        return {"message": "Item added to cart"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/items/{item_id}")
async def edit_cart_item(
    item_id: int,
    data: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        await update_cart_item(db, current_user, item_id, data.quantity)
        return {"message": "Cart item updated"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_cart(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        await remove_cart_item(db, current_user, item_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
