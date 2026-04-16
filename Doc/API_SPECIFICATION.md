# API Specification & Endpoints

## Base URL
- **Development:** `http://localhost:3000/api`
- **Production:** `https://api.ecommerce.com/api`

## Authentication
All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

Access tokens are obtained via login and are valid for 15 minutes. Use refresh endpoint to get a new token.

---

## Response Format

### Success Response (200, 201)
```json
{
  "status": "success",
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

### Error Response (4xx, 5xx)
```json
{
  "status": "error",
  "code": "PRODUCT_NOT_FOUND",
  "message": "Product with ID abc123 not found",
  "details": { /* optional validation errors */ }
}
```

---

## 🔐 Authentication Endpoints

### POST /auth/register
**Description:** Register new customer account  
**Authentication:** None (public)  
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phone": "08123456789"
}
```
**Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "user-123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  }
}
```
**Validation Rules:**
- Email must be valid and unique
- Password min 8 chars, 1 uppercase, 1 number
- Phone must be valid Indonesia number (optional)

---

### POST /auth/login
**Description:** Authenticate user and get tokens  
**Authentication:** None (public)  
**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-123",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "CUSTOMER"
    }
  }
}
```
**Notes:**
- Refresh token sent in httpOnly cookie (secure)
- Access token valid 15 minutes
- Refresh token valid 7 days

---

### POST /auth/refresh
**Description:** Get new access token using refresh token  
**Authentication:** httpOnly cookie (automatic)  
**Request:** Empty body
```
GET /auth/refresh
Cookie: refreshToken=<token>
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### POST /auth/logout
**Description:** Invalidate user session  
**Authentication:** Required (JWT)  
**Request:** Empty body  
**Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## 🛍️ Product Endpoints

### GET /products
**Description:** List all products with filters  
**Authentication:** None (public)  
**Query Parameters:**
```
?search=laptop&category=electronics&minPrice=1000000&maxPrice=20000000
&sortBy=price&sortOrder=asc&page=1&limit=20
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "prod-123",
        "sku": "LAPTOP-001",
        "name": "Gaming Laptop Pro",
        "price": 15000000,
        "stock": 10,
        "images": ["url1", "url2"],
        "category": {
          "id": "cat-123",
          "name": "Electronics"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### GET /products/:id
**Description:** Get product details with variations  
**Authentication:** None (public)  
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "prod-123",
    "sku": "LAPTOP-001",
    "name": "Gaming Laptop Pro",
    "description": "High-performance laptop...",
    "price": 15000000,
    "cost": 12000000,
    "stock": 10,
    "category": { "id": "cat-123", "name": "Electronics" },
    "images": [
      { "url": "image1.jpg", "isPrimary": true },
      { "url": "image2.jpg", "isPrimary": false }
    ],
    "variations": [
      { "name": "Size", "value": "M", "price": 99000 },
      { "name": "Color", "value": "Red", "price": 99000 }
    ]
  }
}
```

---

### POST /products (MANAGER+)
**Description:** Create new product  
**Authentication:** Required (MANAGER, SUPER_ADMIN)  
**Request:**
```json
{
  "sku": "LAPTOP-001",
  "name": "Gaming Laptop Pro",
  "description": "High-performance gaming laptop",
  "categoryId": "cat-123",
  "price": 15000000,
  "cost": 12000000,
  "stock": 10
}
```
**Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "prod-123",
    "sku": "LAPTOP-001",
    "name": "Gaming Laptop Pro",
    "price": 15000000
  }
}
```

---

### PUT /products/:id (MANAGER+)
**Description:** Update product details  
**Authentication:** Required (MANAGER, SUPER_ADMIN)  
**Request: Same as POST**  
**Response (200): Same as POST**

---

### DELETE /products/:id (MANAGER+)
**Description:** Soft delete product  
**Authentication:** Required (MANAGER, SUPER_ADMIN)  
**Response (200):**
```json
{
  "status": "success",
  "message": "Product deleted successfully"
}
```

---

### GET /categories
**Description:** List all product categories  
**Authentication:** None (public)  
**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "id": "cat-123",
      "name": "Electronics",
      "slug": "electronics",
      "productCount": 45
    },
    {
      "id": "cat-124",
      "name": "Fashion",
      "slug": "fashion",
      "productCount": 120
    }
  ]
}
```

---

## 📦 Order Endpoints

### POST /orders
**Description:** Create new order from cart  
**Authentication:** Required (CUSTOMER)  
**Request:**
```json
{
  "items": [
    {
      "productId": "prod-123",
      "quantity": 2
    }
  ],
  "shippingAddressId": "addr-123",
  "notes": "Please deliver carefully"
}
```
**Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "order-123",
    "orderNumber": "ORD-20240101-001",
    "status": "PENDING",
    "totalAmount": 30000000,
    "items": [
      {
        "productId": "prod-123",
        "quantity": 2,
        "price": 15000000
      }
    ],
    "shippingOptions": [
      {
        "provider": "GRAB",
        "cost": 50000,
        "estimatedDays": 1
      },
      {
        "provider": "KURIR_TOKO",
        "cost": 45000,
        "estimatedDays": 2
      }
    ]
  }
}
```

---

### GET /orders
**Description:** List customer's orders  
**Authentication:** Required (CUSTOMER)  
**Query Parameters:**
```
?status=PENDING&sortBy=date&sortOrder=desc&page=1&limit=10
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "order-123",
        "orderNumber": "ORD-20240101-001",
        "status": "SHIPPED",
        "totalAmount": 30000000,
        "createdAt": "2024-01-01T10:00:00Z",
        "shipment": {
          "provider": "GRAB",
          "trackingNumber": "GRAB123456",
          "status": "IN_TRANSIT"
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 5, "pages": 1 }
  }
}
```

---

### GET /orders/:id
**Description:** Get order details and tracking info  
**Authentication:** Required (CUSTOMER - own order, ADMIN+)  
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "order-123",
    "orderNumber": "ORD-20240101-001",
    "status": "SHIPPED",
    "totalAmount": 30000000,
    "items": [ /* ... */ ],
    "payment": {
      "status": "PAID",
      "method": "XENDIT_CARD",
      "paidAt": "2024-01-01T10:05:00Z"
    },
    "shipment": {
      "provider": "GRAB",
      "trackingNumber": "GRAB123456",
      "status": "IN_TRANSIT",
      "events": [
        { "status": "PICKED_UP", "location": "Jakarta", "time": "2024-01-01T11:00:00Z" },
        { "status": "IN_TRANSIT", "location": "Bogor", "time": "2024-01-01T13:00:00Z" }
      ]
    }
  }
}
```

---

### PUT /orders/:id/cancel (CUSTOMER)
**Description:** Cancel pending order  
**Authentication:** Required (CUSTOMER - own order)  
**Request:** Empty body  
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "order-123",
    "status": "CANCELLED"
  }
}
```
**Notes:**
- Can only cancel PENDING orders
- PAID orders go to REFUNDED status

---

### GET /orders/:id/invoice
**Description:** Download order invoice as PDF  
**Authentication:** Required (CUSTOMER - own order, ADMIN+)  
**Response:** PDF file (Content-Type: application/pdf)

---

## 💳 Payment Endpoints

### POST /payments/initialize
**Description:** Initialize payment via Xendit  
**Authentication:** Required (CUSTOMER)  
**Request:**
```json
{
  "orderId": "order-123"
}
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "paymentId": "pay-123",
    "xenditId": "xendit-xxx",
    "paymentUrl": "https://checkout.xendit.co/...",
    "amount": 30000000,
    "expiresAt": "2024-01-01T11:00:00Z"
  }
}
```

---

### GET /payments/:xenditId/status
**Description:** Check payment status  
**Authentication:** Required (CUSTOMER)  
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "xenditId": "xendit-xxx",
    "paymentStatus": "PAID",
    "paidAt": "2024-01-01T10:05:00Z"
  }
}
```

---

## 🚚 Shipping Endpoints

### POST /shipping/rates
**Description:** Calculate shipping rates for order  
**Authentication:** Required (CUSTOMER)  
**Request:**
```json
{
  "orderId": "order-123",
  "origin": "Jakarta",
  "destination": "Bandung",
  "weight": 2.5
}
```
**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "provider": "GRAB",
      "cost": 50000,
      "estimatedDays": 1,
      "estimatedTime": "Same day"
    },
    {
      "provider": "GOJEK",
      "cost": 45000,
      "estimatedDays": 1,
      "estimatedTime": "Same day"
    },
    {
      "provider": "KURIR_TOKO",
      "cost": 40000,
      "estimatedDays": 2,
      "estimatedTime": "Next day"
    },
    {
      "provider": "RAJAONGKIR",
      "cost": 35000,
      "estimatedDays": 3,
      "estimatedTime": "3 days"
    }
  ]
}
```

---

### GET /shipping/providers
**Description:** List enabled shipping providers  
**Authentication:** None (public)  
**Response (200):**
```json
{
  "status": "success",
  "data": [
    { "id": "GRAB", "name": "Grab Express", "isActive": true },
    { "id": "GOJEK", "name": "GoSend", "isActive": true },
    { "id": "KURIR_TOKO", "name": "Kurir Toko", "isActive": true },
    { "id": "RAJAONGKIR", "name": "Raja Ongkir", "isActive": true }
  ]
}
```

---

### PUT /admin/shipping/kurir-toko (SUPER_ADMIN)
**Description:** Configure Kurir Toko formula parameters  
**Authentication:** Required (SUPER_ADMIN)  
**Request:**
```json
{
  "baseGrabRate": 1.0,
  "discountPercent": 10,
  "minimumCharge": 15000,
  "surchargePercent": 0
}
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "config-123",
    "baseGrabRate": 1.0,
    "discountPercent": 10,
    "minimumCharge": 15000,
    "surchargePercent": 0
  }
}
```

---

### GET /admin/shipping/price-logs
**Description:** Get Kurir Toko price calculation audit log  
**Authentication:** Required (SUPER_ADMIN)  
**Query Parameters:**
```
?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "log-123",
        "shipmentId": "ship-123",
        "originCity": "Jakarta",
        "destinationCity": "Bandung",
        "grabRate": 50000,
        "calculatedRate": 45000,
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 150, "pages": 3 }
  }
}
```

---

## 📊 Admin Endpoints

### GET /admin/dashboard
**Description:** Get admin dashboard summary  
**Authentication:** Required (ADMIN+)  
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "today": {
      "orders": 15,
      "revenue": 450000000,
      "avgOrderValue": 30000000
    },
    "alerts": {
      "lowStockProducts": 5,
      "pendingOrders": 8,
      "failedPayments": 2
    }
  }
}
```

---

### GET /admin/orders
**Description:** List all orders with filters  
**Authentication:** Required (ADMIN+)  
**Query Parameters:**
```
?status=PENDING&customerId=user-123&startDate=2024-01-01&page=1&limit=20
```
**Response (200):** Similar to customer orders endpoint, but shows all orders

---

### PUT /admin/orders/:id/status (ADMIN+)
**Description:** Update order status  
**Authentication:** Required (ADMIN, MANAGER)  
**Request:**
```json
{
  "status": "PROCESSING"
}
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "order-123",
    "status": "PROCESSING",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

---

### GET /admin/inventory/logs
**Description:** Get stock change history  
**Authentication:** Required (SUPER_ADMIN)  
**Query Parameters:**
```
?productId=prod-123&type=SALE&startDate=2024-01-01&page=1&limit=50
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "log-123",
        "productId": "prod-123",
        "type": "SALE",
        "quantity": -5,
        "reference": "order-123",
        "notes": "Order ORD-20240101-001",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 200, "pages": 4 }
  }
}
```

---

### POST /admin/inventory/batch-upload (MANAGER+)
**Description:** Bulk upload inventory from CSV  
**Authentication:** Required (MANAGER, SUPER_ADMIN)  
**Request:** multipart/form-data
```
- file: CSV file (sku, stock, price)
```
**CSV Format:**
```csv
sku,stock,price,status
LAPTOP-001,10,15000000,ACTIVE
TSHIRT-001,150,99000,ACTIVE
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "uploaded": 150,
    "updated": 145,
    "skipped": 5,
    "errors": [
      { "sku": "UNKNOWN-SKU", "reason": "Product not found" }
    ]
  }
}
```

---

## 📈 Report Endpoints

### GET /reports/sales
**Description:** Generate sales report  
**Authentication:** Required (MANAGER+)  
**Query Parameters:**
```
?startDate=2024-01-01&endDate=2024-01-31&groupBy=day&categoryId=cat-123
```
**Response (200):**
```json
{
  "status": "success",
  "data": {
    "period": "January 2024",
    "totalSales": 45000000000,
    "totalOrders": 1500,
    "averageOrderValue": 30000000,
    "breakdown": [
      {
        "date": "2024-01-01",
        "sales": 450000000,
        "orders": 15,
        "items": 45
      }
    ]
  }
}
```

---

### GET /reports/products
**Description:** Get best-selling products report  
**Authentication:** Required (MANAGER+)  
**Query Parameters:**
```
?startDate=2024-01-01&endDate=2024-01-31&limit=10
```
**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "productId": "prod-123",
      "sku": "LAPTOP-001",
      "name": "Gaming Laptop Pro",
      "unitsSold": 45,
      "revenue": 675000000,
      "avgRating": 4.8
    }
  ]
}
```

---

### POST /reports/schedule (MANAGER+)
**Description:** Schedule automated report delivery via email  
**Authentication:** Required (MANAGER, SUPER_ADMIN)  
**Request:**
```json
{
  "reportType": "SALES",
  "frequency": "WEEKLY",
  "dayOfWeek": "MONDAY",
  "time": "09:00",
  "recipients": ["manager@example.com"]
}
```
**Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "sched-123",
    "reportType": "SALES",
    "frequency": "WEEKLY",
    "isActive": true
  }
}
```

---

## Error Codes

Common error codes returned by API:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_CREDENTIALS | 401 | Email or password incorrect |
| TOKEN_EXPIRED | 401 | Access token expired, use refresh endpoint |
| UNAUTHORIZED | 403 | Access denied (permission/role issue) |
| PRODUCT_NOT_FOUND | 404 | Product doesn't exist |
| ORDER_NOT_FOUND | 404 | Order doesn't exist |
| INSUFFICIENT_STOCK | 400 | Not enough inventory |
| INVALID_INPUT | 400 | Validation error |
| PAYMENT_FAILED | 400 | Payment initialization failed |
| DUPLICATE_EMAIL | 409 | Email already registered |
| INTERNAL_ERROR | 500 | Server error |

---

**API Version:** 1.0  
**Last Updated:** April 16, 2026
