from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Product
from schemas import ProductCreate, ProductUpdate


async def get_all_products(db: AsyncSession) -> list[Product]:
    result = await db.execute(select(Product).order_by(Product.product_id))
    return list(result.scalars().all())


async def get_product_by_id(db: AsyncSession, product_id: int) -> Product | None:
    result = await db.execute(select(Product).where(Product.product_id == product_id))
    return result.scalar_one_or_none()


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    product = Product(name=data.name, price=data.price, stock=data.stock)
    db.add(product)
    await db.flush()
    return product


async def update_product(db: AsyncSession, product_id: int, data: ProductUpdate) -> Product | None:
    product = await get_product_by_id(db, product_id)
    if not product:
        return None
    if data.name is not None:
        product.name = data.name
    if data.price is not None:
        product.price = data.price
    if data.stock is not None:
        product.stock = data.stock
    await db.flush()
    return product


async def delete_product(db: AsyncSession, product_id: int) -> bool:
    product = await get_product_by_id(db, product_id)
    if not product:
        return False
    await db.delete(product)
    await db.flush()
    return True
