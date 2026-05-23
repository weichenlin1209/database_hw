import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=4, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    user_id: int
    username: str
    role: str

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    price: float = Field(..., gt=0)
    stock: int = Field(..., ge=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    product_id: int
    name: str
    price: float
    stock: int

    model_config = {"from_attributes": True}


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    cart_item_id: int
    product_id: int
    name: str
    price: float
    quantity: int
    total: float

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    cart_id: int
    items: list[CartItemResponse]
    total_price: float

    model_config = {"from_attributes": True}


class OrderItemResponse(BaseModel):
    order_item_id: int
    product_id: int
    name: str
    price: float
    quantity: int

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    order_id: int
    total_price: float
    created_at: datetime.datetime
    items: list[OrderItemResponse]

    model_config = {"from_attributes": True}
