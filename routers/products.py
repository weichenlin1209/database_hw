from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.products import create_product, delete_product, get_all_products, update_product
from database import get_db
from dependencies import get_current_user, require_admin
from models import User
from schemas import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
async def list_products(db: AsyncSession = Depends(get_db)):
    return await get_all_products(db)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def add_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return await create_product(db, data)


@router.put("/{product_id}", response_model=ProductResponse)
async def edit_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    product = await update_product(db, product_id, data)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    deleted = await delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
