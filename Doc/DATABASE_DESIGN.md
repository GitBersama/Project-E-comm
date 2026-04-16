# Database Design Document

## Overview

The e-commerce database is designed using **PostgreSQL** with **Prisma ORM**. The schema is optimized for:
- Data integrity (ACID transactions)
- Query performance (strategic indexing)
- Audit compliance (activity logs)
- Scalability (proper relationships)

---

## Core Entities & Relationships

### 1. User Management

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ email (UQ)  │
│ password    │
│ name        │
│ phone       │
│ role (ENUM) │
│ status      │
│ createdAt   │
│ updatedAt   │
└──────┬──────┘
       │
       ├─◇ Address (1-to-many)
       ├─◇ RefreshToken (1-to-many)
       ├─◇ Order (1-to-many)
       └─◇ ActivityLog (1-to-many)

Address:
  - id (PK)
  - userId (FK)
  - label (e.g., "Home", "Office")
  - street, city, province, zipCode
  - isDefault (boolean)

RefreshToken:
  - id (PK)
  - userId (FK)
  - token (unique)
  - expiresAt (datetime)

Indexes:
  - User(email) - for login lookup
  - User(role, status) - for admin filtering
  - RefreshToken(userId, expiresAt) - for cleanup
```

**Design Notes:**
- Passwords hashed with bcrypt (never stored in plain)
- Role-based access control (4 types: SUPER_ADMIN, MANAGER, ADMIN, CUSTOMER)
- Multiple addresses per customer (one marked as default)
- Refresh tokens stored in DB for invalidation on logout

---

### 2. Product Management

```
┌─────────────┐
│  Category   │
├─────────────┤
│ id (PK)     │
│ name (UQ)   │
│ slug (UQ)   │
│ description │
│ image       │
│ isActive    │
└──────┬──────┘
       │
       ├─◇ Product (1-to-many)

┌──────────────────┐
│    Product       │
├──────────────────┤
│ id (PK)          │
│ sku (UQ)         │
│ name             │
│ description      │
│ categoryId (FK)  │
│ price (float)    │
│ cost (float)     │
│ stock (int)      │
│ isActive         │
│ isVisible        │
│ createdAt        │
│ updatedAt        │
└──────┬───────────┘
       │
       ├─◇ ProductImage (1-to-many)
       ├─◇ ProductVariation (1-to-many)
       ├─◇ StockLog (1-to-many)
       ├─◇ Promotion (1-to-many)
       └─◇ OrderItem (1-to-many)

ProductImage:
  - id (PK)
  - productId (FK)
  - url (string)
  - isPrimary (boolean)
  - order (int, for sequencing)

ProductVariation:
  - id (PK)
  - productId (FK)
  - name (e.g., "Size", "Color")
  - value (e.g., "M", "Red")
  - sku (UQ)
  - price (optional, override)
  - stock (int)

Indexes:
  - Product(categoryId, isVisible) - for catalog
  - Product(sku) - for lookup
  - Product(createdAt) - for sorting
  - StockLog(productId, createdAt) - for history
```

**Design Notes:**
- Separate cost field (for margin calculation)
- Variations support future needs (sizes, colors)
- Stock is denormalized (not calculated from variations)
- Product visibility can be toggled independently of active status
- Images support multiple per product with ordering

---

### 3. Orders & Order Items

```
┌──────────────┐
│    Order     │
├──────────────┤
│ id (PK)      │
│ orderNumber  │ ← Human-readable: ORD-20240101-001
│ customerId   │
│ status (ENUM)│ ← PENDING, PAID, SHIPPED, DELIVERED, etc
│ subtotal     │
│ shippingCost │
│ tax          │
│ discount     │
│ totalAmount  │
│ notes        │
│ createdAt    │
│ updatedAt    │
└──────┬───────┘
       │
       ├─◇ OrderItem (1-to-many)
       ├─◇ Payment (1-to-1)
       ├─◇ Shipment (1-to-1)
       ├─◇ OrderEvent (1-to-many)
       └─→ Address (optional FK for shipping address)

OrderItem:
  - id (PK)
  - orderId (FK)
  - productId (FK)
  - quantity (int)
  - price (float) ← Captured at order time
  - subtotal (float) ← quantity * price

Indexes:
  - Order(customerId, status) - for customer's pending orders
  - Order(createdAt) - for date range queries
  - Order(orderNumber) - for lookup
  - OrderItem(productId) - for product sales analysis
```

**Design Notes:**
- Order number auto-generated, human-readable format
- Price stored with order (prevents issues if product price changes)
- Immutable order items (no edit after creation, only cancel)
- Addresses denormalized in Order for historical accuracy

---

### 4. Payments

```
┌─────────────────┐
│    Payment      │
├─────────────────┤
│ id (PK)         │
│ orderId (FK, UQ)│
│ xenditId (UQ)   │ ← External Xendit reference
│ method (ENUM)   │ ← XENDIT_CARD, BANK_TRANSFER, etc
│ status (ENUM)   │ ← PENDING, PAID, FAILED, EXPIRED
│ amount (float)  │
│ paidAt          │ ← When payment confirmed
│ expireAt        │ ← When payment link expires
│ metadata        │ ← JSON (extra Xendit data)
│ createdAt       │
│ updatedAt       │
└─────────────────┘

Indexes:
  - Payment(orderId) - for order lookup (UQ constraint)
  - Payment(xenditId) - for webhook processing
  - Payment(status) - for admin dashboard
```

**Design Notes:**
- One-to-one with Order (1 payment per order, but 1 order can have retries)
- Xendit ID for webhook correlation
- Metadata stored as JSON for flexibility
- Payment method tracked for analytics

---

### 5. Shipments & Tracking

```
┌──────────────────┐
│    Shipment      │
├──────────────────┤
│ id (PK)          │
│ orderId (FK, UQ) │
│ provider (ENUM)  │ ← GOJEK, GRAB, RAJAONGKIR, KURIR_TOKO
│ trackingNumber   │
│ cost (float)     │
│ status (ENUM)    │ ← PENDING, IN_TRANSIT, DELIVERED, etc
│ estimatedDays    │
│ shippedAt        │
│ deliveredAt      │
│ metadata         │ ← JSON (provider-specific data)
│ createdAt        │
│ updatedAt        │
└──────────┬───────┘
           │
           └─◇ ShipmentEvent (1-to-many)

ShipmentEvent:
  - id (PK)
  - shipmentId (FK)
  - status (ENUM)
  - location (string)
  - description (string)
  - createdAt

Indexes:
  - Shipment(orderId) - for order tracking
  - Shipment(provider) - for provider analytics
  - Shipment(status) - for dashboard
  - ShipmentEvent(shipmentId, createdAt) - for timeline
```

**Design Notes:**
- One shipment per order
- Status tracked at order level and event level
- Provider-specific data in JSON metadata
- Events immutable (audit trail of status changes)

---

### 6. Kurir Toko Configuration

```
┌──────────────────────────┐
│ KurirTokoConfiguration   │
├──────────────────────────┤
│ id (PK)                  │
│ baseGrabRate (float)     │ ← Multiplier for Grab rate
│ discountPercent (float)  │ ← Discount to apply
│ minimumCharge (float)    │ ← Floor price
│ surchargePercent (float) │ ← Additional markup
│ isActive (bool)          │
│ updatedBy (string)       │ ← User ID
│ createdAt, updatedAt     │
└──────────────────────────┘

KurirTokoPriceLog:
  - id (PK)
  - shipmentId (FK, nullable)
  - originCity (string)
  - destinationCity (string)
  - grabRate (float) ← Retrieved rate from Grab API
  - calculatedRate (float) ← After formula applied
  - createdAt

Indexes:
  - KurirTokoPriceLog(shipmentId) - for shipment reference
  - KurirTokoPriceLog(createdAt) - for timeline
```

**Design Notes:**
- Configuration centralized in one record (or use versioning for history)
- Price log immutable (audit trail of calculations)
- Separates raw Grab rate from calculated Kurir Toko rate

---

### 7. Promotions

```
┌──────────────────┐
│    Promotion     │
├──────────────────┤
│ id (PK)          │
│ name             │
│ description      │
│ type (ENUM)      │ ← PERCENTAGE or FIXED
│ value (float)    │
│ code (UQ)        │ ← Promo code
│ productId (FK)   │ ← NULL = store-wide
│ minPurchase      │ ← Min order amount
│ maxDiscount      │ ← Cap on discount
│ startDate        │
│ endDate          │
│ isActive         │
│ createdAt        │
│ updatedAt        │
└──────────────────┘

Indexes:
  - Promotion(code) - for code lookup (UQ constraint)
  - Promotion(isActive, startDate, endDate) - for current promos
```

**Design Notes:**
- Flexible: product-specific or store-wide
- Type indicates how value is applied (% or fixed amount)
- Date range for time-limited offers
- Max discount prevents loss on high-value items

---

### 8. Stock Management

```
┌─────────────────┐
│    StockLog     │
├─────────────────┤
│ id (PK)         │
│ productId (FK)  │
│ type (ENUM)     │ ← ADJUSTMENT, SALE, RETURN, DAMAGE, etc
│ quantity (int)  │ ← Positive or negative
│ reference       │ ← Order ID, CSV batch ID, etc
│ notes (string)  │
│ createdBy       │ ← User ID (for manual adjustments)
│ createdAt       │
└─────────────────┘

Indexes:
  - StockLog(productId, type) - for filtering
  - StockLog(createdAt) - for date range
  - StockLog(reference) - for reversal lookups
```

**Design Notes:**
- Immutable log (no edits)
- Supports bulk uploads, sales, returns, adjustments
- Reference field links to source transaction
- Quantity can be negative (for deductions)

---

### 9. Audit Logging

```
┌──────────────────┐
│   ActivityLog    │
├──────────────────┤
│ id (PK)          │
│ userId (FK)      │
│ action (string)  │ ← PRODUCT_CREATED, ORDER_PAID, etc
│ entity (string)  │ ← "Product", "Order", etc
│ entityId (string)│ ← ID of affected entity
│ changes (JSON)   │ ← Before/after values
│ ipAddress        │
│ userAgent        │
│ createdAt        │
└──────────────────┘

Indexes:
  - ActivityLog(userId, action) - for user audit trail
  - ActivityLog(action) - for system-wide events
  - ActivityLog(createdAt) - for timeline
```

**Design Notes:**
- Comprehensive audit trail
- Captures what changed and who made the change
- Useful for compliance and debugging
- JSON changes field stores before/after diffs

---

### 10. Other Entities

#### Testimonials
```
┌────────────────┐
│  Testimonial   │
├────────────────┤
│ id (PK)        │
│ name           │
│ email          │
│ rating (1-5)   │
│ message        │
│ status (ENUM)  │ ← PENDING, APPROVED, REJECTED
│ createdAt      │
│ updatedAt      │
└────────────────┘
```

#### Daily Reports
```
┌──────────────────┐
│  DailyReport     │
├──────────────────┤
│ id (PK)          │
│ date (datetime)  │
│ totalOrders      │
│ totalRevenue     │
│ totalItems       │
│ cancelledOrders  │
│ completedOrders  │
│ createdAt        │
└──────────────────┘
```

---

## Relationships Diagram

```sql
-- User relationships
User 1 --- * Address
User 1 --- * RefreshToken
User 1 --- * Order
User 1 --- * ActivityLog

-- Product relationships
Category 1 --- * Product
Product 1 --- * ProductImage
Product 1 --- * ProductVariation
Product 1 --- * StockLog
Product 1 --- * OrderItem
Product 1 --- * Promotion

-- Order relationships
Order 1 --- * OrderItem
Order 1 --- 1 Payment
Order 1 --- 1 Shipment
Order 1 --- * OrderEvent
Order * --- 1 Address (shipping address)

-- Shipment relationships
Shipment 1 --- * ShipmentEvent

-- Cross-cutting
Product 1 --- * Testimonial (future: if product rating)
```

---

## Indexing Strategy

### High-Priority Indexes

1. **User Authentication**
   - `User(email)` - Login lookup
   - `User(id, role)` - RBAC check

2. **Product Search**
   - `Product(categoryId, isVisible, createdAt)` - Catalog listing
   - `Product(sku)` - SKU lookup
   - `ProductVariation(sku)` - Variation lookup

3. **Order Processing**
   - `Order(customerId, status)` - Customer's pending orders
   - `Order(createdAt)` - Date range queries
   - `OrderItem(productId)` - Best-selling products

4. **Audit & Reports**
   - `StockLog(productId, createdAt)` - Stock history
   - `ActivityLog(userId, createdAt)` - User audit trail
   - `Payment(status, createdAt)` - Dashboard

### Composite Indexes

```sql
CREATE INDEX idx_order_customer_status ON "Order"("customerId", "status");
CREATE INDEX idx_product_category_visible ON "Product"("categoryId", "isVisible");
CREATE INDEX idx_stocklog_product_date ON "StockLog"("productId", "createdAt");
```

---

## Query Optimization

### N+1 Prevention

**Problem:**
```typescript
// BAD: N+1 query
const orders = await prisma.order.findMany();
for (const order of orders) {
  order.customer = await prisma.user.findUnique({ 
    where: { id: order.customerId } 
  }); // N additional queries
}
```

**Solution:**
```typescript
// GOOD: Single query with relation
const orders = await prisma.order.findMany({
  include: { customer: true }
});
```

### Large Dataset Pagination

```typescript
const page = 1;
const limit = 20;
const [items, total] = await Promise.all([
  prisma.order.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  }),
  prisma.order.count()
]);
```

### Aggregations (Reports)

```typescript
// Sales by date
const salesByDate = await prisma.order.groupBy({
  by: ['createdAt'],
  where: { status: 'PAID' },
  _sum: { totalAmount: true },
  _count: { id: true }
});
```

---

## Data Integrity

### Constraints

1. **Unique Constraints**
   - `User(email)` - One email per user
   - `Product(sku)` - One SKU per product
   - `Order(orderNumber)` - Unique order reference
   - `Payment(xenditId)` - One Xendit ID per payment

2. **Foreign Key Constraints**
   - `CASCADE DELETE` - If product deleted, delete order items
   - `SET NULL` - If user deleted, user_id in logs becomes NULL
   - `RESTRICT` - If category has products, can't delete category

3. **Check Constraints**
   - Stock ≥ 0
   - Price > 0
   - Discount ≤ subtotal

### Transactions (Multi-step operations)

```typescript
// Atomic order creation
const order = await prisma.$transaction(async (tx) => {
  // 1. Create order
  const order = await tx.order.create({ data: orderData });

  // 2. Create order items
  await tx.orderItem.createMany({ data: items });

  // 3. Update product stock
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } }
    });
  }

  // 4. Log stock changes
  await tx.stockLog.createMany({ data: logs });

  return order;
});
```

---

## Migration Strategy

### Development
```bash
npm run prisma:migrate -- --name add_field
```

### Production
```bash
# Test migrate locally first
npm run prisma:migrate:prod
```

### Zero-downtime Migrations
- Use `ColumnDefault` in schema for adds
- Don't require new fields immediately
- Deploy code before migration

---

## Scalability Considerations

### Future Partitioning (for very large tables)

```sql
-- Orders table partitioned by date
CREATE TABLE "Order" (
  ...
) PARTITION BY RANGE (date_trunc('month', "createdAt")
);

CREATE TABLE order_2024_01 PARTITION OF "Order"
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE order_2024_02 PARTITION OF "Order"
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

### Read Replicas

```typescript
// Primary DB for writes
const primary = new PrismaClient({ datasources: { db: { url: primaryConnStr } } });

// Replica for reads (optional caching layer)
const replica = new PrismaClient({ datasources: { db: { url: replicaConnStr } } });

// Usage
await primary.product.create({ data: newProduct });
await replica.product.findMany(); // Read from replica
```

---

**Document Version:** 1.0  
**Last Updated:** April 16, 2026
