from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import CartItem, Order, OrderItem, Product, User


async def checkout(db: AsyncSession, user: User) -> Order:
    cart_result = await db.execute(
        select(CartItem)
        .where(CartItem.cart.has(user_id=user.user_id))
        .options(selectinload(CartItem.product))
    )
    cart_items: list[CartItem] = list(cart_result.scalars().all())

    if not cart_items:
        raise ValueError("Cart is empty")

    total_price = Decimal("0.00")
    order_items_data = []

    for item in cart_items:
        product = item.product
        if product.stock < item.quantity:
            raise ValueError(f"Insufficient stock for '{product.name}' (available: {product.stock}, requested: {item.quantity})")
        product.stock -= item.quantity
        line_total = Decimal(str(product.price)) * item.quantity
        total_price += line_total
        order_items_data.append({
            "product_id": product.product_id,
            "name": product.name,
            "price": product.price,
            "quantity": item.quantity,
        })

    order = Order(user_id=user.user_id, total_price=float(total_price))
    db.add(order)
    await db.flush()

    for oi_data in order_items_data:
        order_item = OrderItem(order_id=order.order_id, **oi_data)
        db.add(order_item)

    for item in cart_items:
        await db.delete(item)

    await db.flush()
    await db.refresh(order)

    result = await db.execute(
        select(Order)
        .where(Order.order_id == order.order_id)
        .options(selectinload(Order.items))
    )
    return result.scalar_one()


async def get_user_orders(db: AsyncSession, user: User) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.user_id == user.user_id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())
