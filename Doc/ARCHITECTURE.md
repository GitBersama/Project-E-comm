# E-Commerce Architecture & Design Document

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Scalability Considerations](#scalability-considerations)
7. [Technology Rationale](#technology-rationale)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT APPLICATIONS                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Web Browser (React + Vite)                         │   │
│  │  - Customer Portal                                  │   │
│  │  - Admin Dashboard                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────┬──────────────────────────────────────────┬────┘
             │                                          │
             │ HTTPS / REST API                        │ JWT Auth
             │                                          │
┌────────────▼──────────────────────────────────────────▼────┐
│                    LOAD BALANCER / NGINX                    │
│  - CORS Handling                                            │
│  - Rate Limiting                                            │
│  - SSL Termination                                          │
└────────────┬──────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────┐
│              EXPRESS.JS API SERVER                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Middleware Layer                                     │  │
│  │ - AuthMiddleware (JWT verification)                 │  │
│  │ - RBACMiddleware (Role check)                        │  │
│  │ - ValidationMiddleware (Zod)                         │  │
│  │ - ErrorHandler                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Route Handlers (Controllers)                         │  │
│  │ - authRouter                                         │  │
│  │ - productsRouter                                     │  │
│  │ - ordersRouter                                       │  │
│  │ - shippingRouter                                     │  │
│  │ - paymentsRouter                                     │  │
│  │ - reportsRouter                                      │  │
│  │ - adminRouter                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Service Layer (Business Logic)                       │  │
│  │ - AuthService (JWT, passwords)                       │  │
│  │ - ProductService (CRUD, search)                      │  │
│  │ - OrderService (creation, updates)                   │  │
│  │ - ShippingService (provider integration)             │  │
│  │ - PaymentService (Xendit integration)                │  │
│  │ - ReportService (data aggregation)                   │  │
│  │ - EmailService (notifications)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Data Access Layer (Prisma ORM)                       │  │
│  │ - Query builder                                      │  │
│  │ - Relationships handling                             │  │
│  │ - Migrations                                         │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────┬───────────────────────────┬────────────┬────────┘
           │                           │            │
           ▼                           ▼            ▼
    ┌─────────────┐          ┌──────────────┐  ┌────────────┐
    │ PostgreSQL  │          │ Redis Cache  │  │ Message   │
    │ Database    │          │ (Optional)   │  │ Queue     │
    │             │          │              │  │ (BullMQ)  │
    └─────────────┘          └──────────────┘  └────────────┘
                                    │                  │
                                    ▼                  ▼
                            ┌──────────────┐  ┌─────────────┐
                            │ Product      │  │ Email       │
                            │ Catalog      │  │ Notifications
                            │ Rates        │  │ (Async)     │
                            └──────────────┘  └─────────────┘

┌──────────────────────────────────────────────────────────────┐
│            EXTERNAL SERVICES (Third-party APIs)              │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────┐  ┌────────────┐  ┌─────────────┐             │
│ │  Xendit    │  │   Grab     │  │  RajaOngkir │             │
│ │ (Payments) │  │ (Shipping) │  │ (Shipping)  │             │
│ └────────────┘  └────────────┘  └─────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### 1. Request-Response Cycle

```
Client Request
      │
      ▼
┌─────────────────────────────────────────┐
│ Express Router                          │
│ - Route matching                        │
│ - HTTP method handling                  │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ Middleware Stack (Sequential)           │
│ 1. CORS, helmet, compression            │
│ 2. Request parsing (JSON, form)         │
│ 3. Authentication (JWT verify)          │
│ 4. Authorization (RBAC check)           │
│ 5. Request validation (Zod)             │
│ 6. Custom middleware                    │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ Controller (Handle Request)             │
│ - Extract params/query/body             │
│ - Call service layer                    │
│ - Format response                       │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ Service Layer (Business Logic)          │
│ - Input validation                      │
│ - Database queries (Prisma)             │
│ - External API calls                    │
│ - Response transformation               │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ Database Layer (Prisma)                 │
│ - Query optimization                    │
│ - Relationship loading                  │
│ - Transaction handling                  │
└─────────────────────────────────────────┘
      │
      ▼
    Response with Data
```

### 2. Layered Architecture

#### Controller Layer
- **Responsibility:** HTTP request/response handling
- **Does:** 
  - Extract input (params, query, body)
  - Call appropriate service
  - Format and send response
- **Example:**
```typescript
// POST /api/products
async createProduct(req: Request, res: Response) {
  const validated = validateProductPayload(req.body);
  const product = await productService.create(validated);
  res.status(201).json(product);
}
```

#### Service Layer
- **Responsibility:** Business logic isolation
- **Does:**
  - Implement use cases (create order, calculate shipping, etc)
  - Coordinate between multiple database operations
  - Call external APIs
  - Data transformation
- **Example:**
```typescript
// Reusable for multiple sources (API, CLI, webhooks)
async createOrder(orderData: CreateOrderDTO) {
  const customer = await this.validateCustomer(orderData.customerId);
  const items = await this.validateItems(orderData.items);
  const shipping = await this.calculateShipping(orderData);
  
  const order = await db.transaction(async (tx) => {
    const order = await tx.order.create({ data: orderData });
    await tx.stockLog.createMany({ data: stockChanges });
    return order;
  });
  
  await this.emailService.sendOrderConfirmation(order);
  return order;
}
```

#### Data Access Layer (Prisma)
- **Responsibility:** Database interaction
- **Features:**
  - Type-safe queries via Prisma client
  - Automatic relationship loading
  - Migration management
  - Transaction support

### 3. Middleware Strategy

```
Request
  │
  ├─► ErrorHandler (wrapper for async errors)
  ├─► Helmet (security headers)
  ├─► CORS (cross-origin)
  ├─► Express.json() (body parsing)
  ├─► RequestLogger (logging)
  ├─► Auth Middleware (JWT verify)
  │    └─ If valid: attach user to req.user
  │    └─ If invalid: reject with 401
  │
  ├─► RBAC Middleware (role check)
  │    └─ Check req.user.role against route requirements
  │
  ├─► ValidationMiddleware (Zod)
  │    └─ Validate req.body, req.params, req.query
  │    └─ If invalid: reject with 400 error details
  │
  ├─► RateLimiter (specific routes)
  │    └─ /api/auth/login, /api/auth/register
  │
  └─► Route Handler (Controller)
```

---

## Frontend Architecture

### 1. Component Hierarchy

```
App (Router)
│
├─ Layout Components
│  ├─ Header (Navigation)
│  ├─ Footer
│  ├─ Sidebar (Admin only)
│  └─ NotificationBar
│
├─ Page Components
│  ├─ Public Pages
│  │  ├─ Home
│  │  ├─ ProductCatalog
│  │  ├─ ProductDetail
│  │  ├─ About
│  │  ├─ Testimonials
│  │  └─ Promotions
│  │
│  ├─ Auth Pages
│  │  ├─ Login
│  │  ├─ Register
│  │  └─ ForgotPassword (future)
│  │
│  ├─ Customer Pages
│  │  ├─ Cart
│  │  ├─ Checkout
│  │  ├─ Dashboard
│  │  ├─ Orders
│  │  ├─ OrderDetail
│  │  ├─ OrderTracking
│  │  ├─ Profile
│  │  └─ Addresses
│  │
│  └─ Admin Pages
│     ├─ Dashboard
│     ├─ ProductManagement
│     ├─ OrderManagement
│     ├─ StockManagement
│     ├─ UserManagement
│     ├─ ReportBuilder
│     ├─ ShippingConfig
│     └─ Settings
│
└─ Modal Components (Overlay)
   ├─ ConfirmDialog
   ├─ LoadingDialog
   └─ FormModal
```

### 2. State Management

**Philosophy:** Minimal state management, prefer local state.

```
Global State (Zustand)
├─ AuthStore (user, token, login/logout)
├─ NotificationStore (toasts, alerts)
└─ UIStore (sidebar toggle, theme)

Local State (useState)
├─ Form inputs
├─ UI toggles
├─ Filter selections
└─ Pagination state

Context (React Context)
├─ AuthContext (for deeply nested components)
└─ ThemeContext (optional, for dark mode)
```

### 3. Data Fetching

```
Component Mounts
      │
      ▼
Check AuthStore.isAuthenticated
      │
      ├─ No: Redirect to login
      │
      └─ Yes: Fetch data
            │
            ├─ Using axios with JWT interceptor
            ├─ Show loading state
            ├─ On success: Update local state
            ├─ On error: Show error toast
            │
            └─ Use React Query (future optimization)
```

---

## Data Flow

### Order Creation Flow

```
1. Customer Views Product
   └─ GET /api/products/:id
      └─ Response: Product details + price + stock

2. Add to Cart (Local State)
   └─ Update cartStore with product

3. Proceed to Checkout
   └─ POST /api/orders (with cart items)
   
4. Backend Processing
   ├─ Validate items exist + in stock
   ├─ Lock stock (or reserve)
   ├─ Calculate shipping options
   │  ├─ Call Grab API
   │  ├─ Call Gojek API
   │  ├─ Calculate KurirToko rate
   │  └─ Return options
   ├─ Create order (PENDING status)
   ├─ Return order + shipping options
   │
   └─ Response to frontend

5. Customer Selects Shipping + Payment
   └─ POST /api/payments/initialize
      └─ Xendit creates payment link

6. Customer Pays (External)
   ├─ Xendit webhook → backend
   └─ Update Order status to PAID
      └─ Trigger email notification

7. Real-time Status Update
   ├─ WebSocket or polling
   └─ GET /api/orders/:orderId
      └─ Updated shipment status
```

### Admin Report Generation Flow

```
1. Admin Requests Report
   └─ POST /api/reports/sales (with filters: date, category)

2. Backend Processes
   ├─ Query aggregated data from orders table
   │  └─ Group by date/category, sum amounts
   ├─ Join with products/categories for names
   ├─ Format as CSV/PDF/JSON
   └─ Return file

3. Frontend
   ├─ Download file directly
   └─ Optional: Email scheduled report
      └─ Job queue (BullMQ) processes async
```

---

## Security Architecture

### Authentication & Authorization

#### JWT Token Structure
```json
// Access Token (15 minutes, in-memory)
{
  "userId": "user-123",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "iat": 1234567890,
  "exp": 1234569690
}

// Refresh Token (7 days, httpOnly cookie)
{
  "userId": "user-123",
  "iat": 1234567890,
  "exp": 1234567890 + 7days
}
```

#### RBAC Implementation
```typescript
// Protect routes with middleware
app.post('/api/products',
  authenticateJWT,           // Verify token
  authorize(['MANAGER']),    // Check role
  validate(CreateProductSchema), // Validate input
  createProductController
);
```

### Data Protection

- **Passwords:** Hashed with bcrypt (12 rounds)
- **Sensitive Data:** Encrypted at rest (PII fields optional)
- **API Keys:** Stored in environment variables, never in client
- **Database:** Access controlled via user/role in connection string

### API Security

- **CORS:** Whitelist specific domains
- **Rate Limiting:** Throttle login/register endpoints
- **HTTPS:** Enforce SSL in production
- **CSRF:** Token for form submissions (or SameSite cookies)
- **Input Validation:** Zod schema validation
- **SQL Injection:** Protected by Prisma ORM

### Audit Trail

```
ActivityLog table tracks:
- Who (userId)
- What (action, entity)
- When (timestamp)
- Changes (before/after JSON)
- Where (IP address)
- How (user agent)
```

---

## Scalability Considerations

### Database Optimization

1. **Indexes:**
   - User: email (unique), role, status
   - Product: sku (unique), categoryId, isActive, createdAt
   - Order: customerId, status, createdAt, orderNumber
   - Stock: productId, createdAt (for logs)

2. **Partitioning (Future):**
   - Orders table by date (monthly partitions)
   - Audit logs by date range

3. **Query Optimization:**
   - Select only needed fields
   - N+1 query prevention via Prisma relations
   - Aggregations use GROUP BY, not client-side loops

### Caching Strategy

```
Level 1: HTTP Cache-Control headers
├─ Products: 1 hour (public, immutable)
├─ Cart: Session only
└─ User profile: No cache (dynamic)

Level 2: Redis (Optional, for high traffic)
├─ Product catalog (refresh on update)
├─ Shipping rates (refresh hourly)
├─ Category tree
└─ Top-selling products (computed daily)

Invalidation:
├─ Product update → flush all product keys
├─ Stock change → flush specific product
└─ Order event → no cache invalidation needed
```

### Load Balancing

```
Users
  │
  ├─ API Server 1 (Node.js)
  ├─ API Server 2 (Node.js)
  └─ API Server 3 (Node.js)
        ↓
    Shared PostgreSQL
    Shared Redis
    Shared S3 (images)
```

### Workers for Async Tasks

```
BullMQ Job Queue
├─ Email notifications (order confirmation, shipment update)
├─ CSV report generation
├─ Image resize/optimization
└─ Webhook retries (shipping provider callbacks)

Benefits:
├─ Non-blocking checkout
├─ Retry logic with backoff
├─ Scheduling (e.g., send email at specific time)
└─ Monitoring dashboard
```

---

## Technology Rationale

### Why Express.js?

**Pros:**
- Lightweight & fast
- Large ecosystem (middleware, packages)
- Perfect for REST APIs
- Easy to set up and scale

**Considerations:**
- Not opinionated (requires discipline)
- Manual error handling needed
- Authentication middleware required

### Why Prisma?

**Pros:**
- Type-safe queries (catches errors at compile time)
- Auto-generated client from schema
- Simple migration system
- Excellent TypeScript support
- Intuitive API (vs SQL)

**Cons:**
- Slight performance overhead vs raw SQL
- Learning curve for complex queries

**Mitigation:**
- Use `$queryRaw()` for complex/performance-critical queries
- Lazy loading control to prevent N+1

### Why React + Vite?

**Pros:**
- Fast development experience (HMR)
- ESM-based build (tree-shaking)
- Large component ecosystem
- Strong community

**Cons:**
- SPA, need routing + state management
- Client-side rendering (SEO limitations)

**Mitigation:**
- Use React Router for SPA routing
- Meta tags in HTML for critical SEO
- Consider Next.js if SEO becomes critical

### Why Tailwind CSS?

**Pros:**
- Utility-first, highly customizable
- Rapid development (no context switching between CSS/JSX)
- Small bundle size (JIT compilation)
- Responsive design (mobile-first)

**Cons:**
- HTML can look cluttered with class names
- Steep learning curve initially

**Mitigation:**
- Extract custom components for reusability
- Use `@apply` directive for grouped utilities

---

## Deployment Targets

### Development
- Local machine with npm scripts

### Staging
- Docker containers on staging server
- Same as production, smaller scale

### Production
- Docker containers (scalable)
- Load balancer (Nginx/HAProxy)
- PostgreSQL master-replica setup
- Redis for caching
- CDN for static assets
- SSL certificate (Let's Encrypt)

---

**Document Version:** 1.0  
**Last Updated:** April 16, 2026
