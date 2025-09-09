# Order Management API Documentation

## Overview
Complete order management system with Uganda payment integration for Welkome Backend.

## Features
- ✅ Order creation from cart
- ✅ Direct buy from product page
- ✅ Uganda payment methods (MTN Mobile Money, Airtel Money)
- ✅ Order status management
- ✅ Payment verification
- ✅ Order tracking
- ✅ Admin order management

## API Endpoints

### 1. Create Order from Cart
**POST** `/api/v1/orders/cart/checkout`

Create order from user's cart items.

**Request Body:**
```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "+256700123456",
    "address": "Plot 123, Kampala Road",
    "city": "Kampala",
    "district": "Central",
    "postalCode": "256",
    "country": "Uganda",
    "isDefault": true
  },
  "paymentDetails": {
    "method": "mtn_mobile_money",
    "phoneNumber": "+256700123456"
  },
  "notes": "Please deliver after 5 PM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-1234567890-001",
    "userId": "user_id",
    "items": [...],
    "pricing": {
      "subtotal": 50000,
      "shippingCost": 0,
      "discountAmount": 5000,
      "totalAmount": 45000
    },
    "status": "pending",
    "orderSource": "cart"
  }
}
```

### 2. Direct Buy from Product
**POST** `/api/v1/orders/direct-buy`

Buy product directly without adding to cart.

**Request Body:**
```json
{
  "productId": "product_id",
  "variantId": 1,
  "quantity": 2,
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "+256700123456",
    "address": "Plot 123, Kampala Road",
    "city": "Kampala",
    "district": "Central"
  },
  "paymentDetails": {
    "method": "airtel_money",
    "phoneNumber": "+256700123456"
  }
}
```

### 3. Get User Orders
**GET** `/api/v1/orders/my-orders`

Get all orders for authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalOrders": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 4. Get Order by ID
**GET** `/api/v1/orders/:orderId`

Get specific order details.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-1234567890-001",
    "items": [...],
    "shippingAddress": {...},
    "paymentDetails": {...},
    "pricing": {...},
    "status": "confirmed",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Initiate Payment
**POST** `/api/v1/orders/:orderId/payment/initiate`

Initiate payment for an order.

**Request Body:**
```json
{
  "paymentMethod": "mtn_mobile_money",
  "phoneNumber": "+256700123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "orderId": "order_id",
    "transactionId": "transaction_id",
    "paymentMethod": "mtn_mobile_money",
    "amount": 45000,
    "currency": "UGX",
    "status": "processing",
    "instructions": {
      "title": "MTN Mobile Money Payment",
      "steps": [
        "You will receive a popup on your phone",
        "Enter your MTN Mobile Money PIN",
        "Confirm the payment",
        "Wait for confirmation message"
      ],
      "amount": "UGX 45,000",
      "phone": "+256700123456"
    }
  }
}
```

### 6. Verify Payment
**POST** `/api/v1/orders/:orderId/payment/verify`

Check payment status and update order.

**Response:**
```json
{
  "success": true,
  "message": "Payment status verified",
  "data": {
    "orderId": "order_id",
    "paymentStatus": "completed",
    "orderStatus": "confirmed",
    "transactionId": "transaction_id"
  }
}
```

### 7. Get Payment Methods
**GET** `/api/v1/orders/payment/methods`

Get available payment methods for Uganda.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mtn_mobile_money",
      "name": "MTN Mobile Money",
      "description": "Pay using your MTN Mobile Money account",
      "icon": "mtn-logo",
      "supportedNetworks": ["25677", "25678"],
      "processingTime": "Instant",
      "fees": "No additional fees"
    },
    {
      "id": "airtel_money",
      "name": "Airtel Money",
      "description": "Pay using your Airtel Money account",
      "icon": "airtel-logo",
      "supportedNetworks": ["25670", "25675"],
      "processingTime": "Instant",
      "fees": "No additional fees"
    },
    {
      "id": "cash_on_delivery",
      "name": "Cash on Delivery",
      "description": "Pay when your order is delivered",
      "icon": "cash-icon",
      "processingTime": "On delivery",
      "fees": "No additional fees"
    },
    {
      "id": "bank_transfer",
      "name": "Bank Transfer",
      "description": "Transfer directly to our bank account",
      "icon": "bank-icon",
      "processingTime": "1-3 business days",
      "fees": "Bank charges may apply"
    }
  ]
}
```

### 8. Cancel Order
**PATCH** `/api/v1/orders/:orderId/cancel`

Cancel an order.

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

### 9. Update Order Status (Admin)
**PATCH** `/api/v1/orders/:orderId/status`

Update order status (admin only).

**Request Body:**
```json
{
  "status": "shipped",
  "notes": "Order shipped via DHL"
}
```

### 10. Get All Orders (Admin)
**GET** `/api/v1/orders/admin/all-orders`

Get all orders with filtering options.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by order status
- `paymentStatus`: Filter by payment status
- `orderSource`: Filter by order source (cart/direct_buy)

### 11. Get Order Statistics (Admin)
**GET** `/api/v1/orders/admin/stats`

Get order statistics and analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalOrders": 150,
      "totalRevenue": 7500000,
      "pendingOrders": 25,
      "completedOrders": 100,
      "cancelledOrders": 25
    },
    "statusBreakdown": [
      {"_id": "pending", "count": 25},
      {"_id": "confirmed", "count": 30},
      {"_id": "delivered", "count": 100}
    ],
    "paymentBreakdown": [
      {"_id": "completed", "count": 120},
      {"_id": "pending", "count": 30}
    ]
  }
}
```

## Payment Methods

### MTN Mobile Money
- **Network**: 25677, 25678
- **Processing**: Instant
- **Fees**: None
- **Requirements**: MTN Mobile Money account

### Airtel Money
- **Network**: 25670, 25675
- **Processing**: Instant
- **Fees**: None
- **Requirements**: Airtel Money account

### Cash on Delivery
- **Processing**: On delivery
- **Fees**: None
- **Requirements**: Valid delivery address

### Bank Transfer
- **Processing**: 1-3 business days
- **Fees**: Bank charges may apply
- **Requirements**: Bank account

## Order Status Flow

1. **pending** → Order created, awaiting payment
2. **confirmed** → Payment completed, order confirmed
3. **processing** → Order being prepared
4. **shipped** → Order dispatched for delivery
5. **delivered** → Order delivered successfully
6. **cancelled** → Order cancelled
7. **refunded** → Order refunded

## Payment Status Flow

1. **pending** → Payment not initiated
2. **processing** → Payment initiated, awaiting confirmation
3. **completed** → Payment successful
4. **failed** → Payment failed
5. **refunded** → Payment refunded

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Authentication

All endpoints require authentication. Include JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Environment Variables

Add these to your `.env` file:

```env
# MTN Mobile Money
MTN_MOBILE_MONEY_API_URL=https://sandbox.momodeveloper.mtn.com
MTN_API_KEY=your-mtn-api-key
MTN_API_SECRET=your-mtn-api-secret
MTN_SUBSCRIPTION_KEY=your-mtn-subscription-key

# Airtel Money
AIRTEL_MONEY_API_URL=https://openapiuat.airtel.africa
AIRTEL_API_KEY=your-airtel-api-key
AIRTEL_CLIENT_ID=your-airtel-client-id
AIRTEL_CLIENT_SECRET=your-airtel-client-secret
```

## Testing

Use the provided test endpoints to verify the order flow:

1. Create order from cart
2. Initiate payment
3. Verify payment
4. Check order status

## Support

For issues or questions, contact the development team.
