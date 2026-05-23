from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Cart, CartItem, Product, User


async def get_or_create_cart(db: AsyncSession, user: User) -> Cart:
    result = await db.execute(
        select(Cart)
        .where(Cart.user_id == user.user_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    cart = result.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        await db.flush()
    return cart


async def get_cart(db: AsyncSession, user: User) -> Cart:
    result = await db.execute(
        select(Cart)
        .where(Cart.user_id == user.user_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
    )
    cart = result.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        await db.flush()
    return cart


async def add_item_to_cart(db: AsyncSession, user: User, product_id: int, quantity: int) -> CartItem:
    product_result = await db.execute(select(Product).where(Product.product_id == product_id))
    product = product_result.scalar_one_or_none()
    if not product:
        raise ValueError("Product not found")
    if product.stock < quantity:
        raise ValueError("Insufficient stock")

    cart = await get_or_create_cart(db, user)

    existing_result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id,
            CartItem.product_id == product_id,
        )
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        existing.quantity += quantity
        if existing.quantity > product.stock:
            raise ValueError("Insufficient stock")
        await db.flush()
        return existing

    cart_item = CartItem(cart_id=cart.cart_id, product_id=product_id, quantity=quantity)
    db.add(cart_item)
    await db.flush()
    return cart_item


async def update_cart_item(db: AsyncSession, user: User, cart_item_id: int, quantity: int) -> CartItem:
    cart = await get_cart(db, user)
    result = await db.execute(
        select(CartItem)
        .where(CartItem.cart_item_id == cart_item_id, CartItem.cart_id == cart.cart_id)
        .options(selectinload(CartItem.product))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise ValueError("Cart item not found")
    if item.product.stock < quantity:
        raise ValueError("Insufficient stock")
    item.quantity = quantity
    await db.flush()
    return item


async def remove_cart_item(db: AsyncSession, user: User, cart_item_id: int) -> None:
    cart = await get_cart(db, user)
    result = await db.execute(
        select(CartItem).where(
            CartItem.cart_item_id == cart_item_id,
            CartItem.cart_id == cart.cart_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise ValueError("Cart item not found")
    await db.delete(item)
    await db.flush()
