# Shopping Cart System

Shopping cart with FastAPI backend and vanilla HTML/JS frontend.

## Tech Stack

- **Backend**: FastAPI, PostgreSQL (asyncpg + SQLAlchemy async)
- **Auth**: JWT (python-jose, bcrypt)
- **Frontend**: Vanilla HTML/CSS/JS

## Project Structure

```
├── main.py              # FastAPI app entry point
├── database.py          # Database connection (async SQLAlchemy)
├── models.py            # ORM models
├── schemas.py           # Pydantic schemas
├── dependencies.py      # JWT auth, RBAC dependencies
├── controllers/         # Business logic
├── routers/             # API endpoints
├── static/              # Frontend files
│   ├── index.html
│   ├── admin.html
│   ├── css/style.css
│   └── js/app.js
├── .env.example         # Environment variable template
└── requirements.txt
```

## Setup

### 1. Database

Ensure PostgreSQL is running. Copy and edit the environment file:

```bash
cp .env.example .env
```

Fill in your PostgreSQL credentials in `.env`.

### 2. Install & Run

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open http://localhost:8000

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register a new user |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/products` | No | List all products |
| POST | `/products` | Admin | Create a product |
| PUT | `/products/{id}` | Admin | Update a product |
| DELETE | `/products/{id}` | Admin | Delete a product |
| GET | `/cart` | User | View your cart |
| POST | `/cart/items` | User | Add item to cart |
| PUT | `/cart/items/{id}` | User | Update item quantity |
| DELETE | `/cart/items/{id}` | User | Remove item from cart |
| POST | `/orders/checkout` | User | Place order (transactional) |
| GET | `/orders` | User | View order history |

## Admin Access

After registering, promote your user to admin:

```bash
PGPASSWORD=your_password psql -h localhost -U your_user -d your_database \
  -c "UPDATE users SET role='admin' WHERE username='YOUR_USERNAME'"
```

Then visit http://localhost:8000/admin.html
