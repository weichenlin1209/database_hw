-- ==========================================
-- 階段一：建立獨立實體 (無 Foreign Keys)
-- ==========================================

-- 定義 User 表[cite: 1]
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user'
);

-- 定義 Product 表[cite: 1]
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0
);

-- ==========================================
-- 階段二：建立第一層依賴實體
-- ==========================================

-- 定義 Cart 表[cite: 1]
-- 邏輯限制：User 與 Cart 是 1:1 關係[cite: 1]。加入 UNIQUE 約束確保此邏輯。
CREATE TABLE carts (
    cart_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE
);

-- 定義 Order 表[cite: 1]
-- 邏輯限制：User 與 Order 是 1:N 關係[cite: 1]。
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 階段三：建立第二層依賴實體 (關聯表)
-- ==========================================

-- 定義 CartItem 表[cite: 1]
-- 邏輯限制：負責橋接 Cart 與 Product[cite: 1]。
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1
);

-- 定義 OrderItem 表[cite: 1]
-- 邏輯限制：負責橋接 Order 與 Product[cite: 1]。
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price_at_purchase DECIMAL(10, 2) NOT NULL
);
