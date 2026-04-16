# E-Commerce Platform Setup Guide

## Project Overview

A modern, scalable e-commerce application built with:
- **Backend:** Node.js + Express.js + PostgreSQL + Prisma
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Authentication:** JWT + Refresh Token
- **Payment:** Xendit Integration
- **Shipping:** Grab, Gojek, RajaOngkir + Custom Kurir Toko

---

## 📋 Prerequisites

Ensure you have installed:
- **Node.js** v18+ (LTS recommended)
- **npm** v9+
- **PostgreSQL** v14+
- **Git**
- **Docker** (optional, for containerization)

Install Node.js from: https://nodejs.org/

---

## 🚀 Quick Start

### 1. Clone & Setup Workspace

```bash
cd d:/Project/e-comm

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Back to root
cd ..
```

### 2. Configure Environment Variables

#### Backend (.env)

```bash
# Create .env from template
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce_db
JWT_SECRET=your_secret_key_here
```

#### Frontend (.env)

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Database Setup

```bash
# From backend directory
cd backend

# Create PostgreSQL database
createdb ecommerce_db

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed sample data
npm run prisma:seed

# View database in Studio
npm run prisma:studio
```

---

## 🏃 Running the Application

### Terminal 1: Backend Development Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3000`

### Terminal 2: Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📦 Project Structure

```
e-comm/
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── config/          # Database, env configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API endpoints
│   │   ├── schemas/         # Zod validation
│   │   ├── middleware/      # Auth, RBAC, error handling
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helpers (JWT, password, etc)
│   │   └── app.ts           # Express initialization
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Schema migrations
│   ├── dist/                # Compiled output
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env                 # Local secrets (gitignored)
│
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client
│   │   ├── context/         # React Context (Auth)
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helpers
│   │   ├── styles/          # Global CSS/Tailwind
│   │   ├── App.tsx
│   │   ├── main.tsx         # Entry point
│   │   └── routes/          # Route definitions
│   ├── public/              # Static assets
│   ├── dist/                # Build output
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env                 # Local secrets (gitignored)
│
├── Doc/                     # Documentation
├── PRD.md                   # Product Requirements
├── .gitignore
└── README.md                # This file
```

---

## 🔧 Development Scripts

### Backend

```bash
cd backend

npm run dev              # Start development server with hot reload
npm run build           # Compile TypeScript
npm start               # Run compiled app (production)
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Create/run migrations
npm run prisma:seed     # Seed database with sample data
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run format          # Format code with Prettier
npm run type-check      # Type-check without emitting
```

### Frontend

```bash
cd frontend

npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run format          # Format code with Prettier
npm run type-check      # Type-check without emitting
```

---

## 🗄️ Database Schema Overview

### Core Entities

```
Users
├── id (PK)
├── email (UNIQUE)
├── password (encrypted)
├── role (ENUM: SUPER_ADMIN, MANAGER, ADMIN, CUSTOMER)
├── name
├── phone
├── addresses (1-to-many)
└── created_at, updated_at

Products
├── id (PK)
├── sku (UNIQUE)
├── name
├── description
├── price
├── cost
├── stock
├── category_id (FK)
├── images (1-to-many)
├── variations (1-to-many)
└── created_at, updated_at

Orders
├── id (PK)
├── order_number (UNIQUE)
├── customer_id (FK)
├── total_amount
├── status (ENUM: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED)
├── items (1-to-many: OrderItems)
├── payment (1-to-1: Payment)
├── shipment (1-to-1: Shipment)
└── created_at, updated_at

Shipments
├── id (PK)
├── order_id (FK)
├── provider (GOJEK, GRAB, RAJAONGKIR, KURIR_TOKO)
├── tracking_number
├── cost
├── status
└── events (1-to-many: ShipmentEvents)

Payments
├── id (PK)
├── order_id (FK)
├── xendit_id (external)
├── amount
├── status (PENDING, PAID, FAILED)
└── created_at
```

---

## 🔐 Authentication Flow

### Login

1. **POST /api/auth/login**
   - Validates email & password
   - Returns `access_token` (15 min) + `refresh_token` (7 days)
   - Refresh token stored in httpOnly cookie

2. **Frontend Storage**
   - Access token: Memory only (cleared on page refresh)
   - Refresh token: HttpOnly cookie (auto-handled)

### Token Refresh

1. Access token expires
2. Frontend auto-calls **POST /api/auth/refresh**
3. Returns new access token
4. Request retried transparently

### Logout

1. Invalidate refresh token in database
2. Clear memory token on frontend
3. Redirect to login

---

## 👥 Role-Based Access Control (RBAC)

| Role | Permissions | Access |
|------|-------------|--------|
| **SUPER_ADMIN** | Full system access | All endpoints + settings |
| **MANAGER** | Create/edit products, orders, promotions | Admin endpoints |
| **ADMIN** | View & update order status | Order management endpoints |
| **CUSTOMER** | Shop, order, track | Public + customer endpoints |

---

## 🛒 Key API Endpoints

### Public Endpoints

- `GET /api/products` - List products
- `GET /api/products/:id` - Product detail
- `GET /api/categories` - Browse categories
- `GET /api/testimonials` - Customer testimonials

### Authentication

- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Customer Endpoints

- `POST /api/orders` - Create order
- `GET /api/orders` - My orders
- `GET /api/orders/:id` - Order detail
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/:id/invoice` - Download invoice

### Admin Endpoints (ADMIN+)

- `GET /api/admin/orders` - All orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/dashboard` - Dashboard summary

### Manager Endpoints (MANAGER+)

- `POST /api/products` - Create product
- `PUT /api/products/:id` - Edit product
- `DELETE /api/products/:id` - Delete product
- `POST /api/inventory/batch-upload` - Upload stock CSV
- `GET /api/reports/sales` - Sales report

---

## 🚢 Deployment Configuration

### Docker (Optional)

```bash
# Build backend image
docker build -t ecommerce-backend ./backend

# Build frontend image
docker build -t ecommerce-frontend ./frontend

# Run with docker-compose
docker-compose up
```

### Environment-specific .env

- `.env.development` - Local development
- `.env.staging` - Staging server
- `.env.production` - Production server

---

## 📝 Coding Standards

### TypeScript

- Strict mode enabled
- Explicit return types on functions
- Use `ESLint` + `Prettier` for formatting

### Naming Conventions

- **Files:** camelCase for utilities, PascalCase for components
- **Functions:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Database:** snake_case columns

### Best Practices

1. **Separate concerns:** Controllers → Services layer
2. **Reuse code:** Extract into utilities/helpers
3. **Error handling:** Use custom error classes
4. **Validation:** Zod for runtime validation
5. **Logging:** Use Winston for structured logs
6. **Security:** Hash passwords, validate inputs, use HTTPS

---

## 🧪 Testing (Future)

```bash
cd backend
npm run test

cd ../frontend
npm run test
```

---

## 🐛 Troubleshooting

### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
psql --version

# Start PostgreSQL (macOS)
brew services restart postgresql

# Start PostgreSQL (Windows)
# Use Services app or command line
net start postgresql-x64-14
```

### Port Already in Use

```bash
# Change PORT in backend/.env
PORT=3001

# Change port in frontend vite.config.ts
port: 5174
```

### Prisma Migration Failed

```bash
# Reset development database
cd backend
npm run prisma:migrate -- --name init
```

---

## 📚 Useful Resources

- [Express Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📞 Support & Contribution

For issues or suggestions, please contact the development team.

---

**Last Updated:** April 16, 2026  
**Version:** 1.0.0-setup
