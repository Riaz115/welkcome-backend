# Wishlist API Documentation

## Overview
Complete wishlist management system for users to save and manage their favorite products.

## Base URL: `/api/v1/wishlist`

All endpoints require authentication. Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Get User's Wishlist
**GET** `/api/v1/wishlist`

Retrieves the current user's wishlist with all saved products.

**Response:**
```json
{
  "success": true,
  "message": "Wishlist retrieved successfully",
  "data": {
    "wishlist": {
      "_id": "wishlist_id",
      "items": [
        {
          "_id": "item_id",
          "productId": {
            "_id": "product_id",
            "title": "Product Name",
            "brand": "Brand Name",
            "images": [...],
            "coverImage": "image_url",
            "variants": [...],
            "price": 100,
            "finalPrice": 80,
            "discount": 20
          },
          "variantId": 1,
          "addedAt": "2024-01-15T10:30:00Z",
          "variantDetails": {
            "color": "Red",
            "size": "M",
            "sku": "SKU123"
          }
        }
      ],
      "itemCount": 1,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 2. Add Product to Wishlist
**POST** `/api/v1/wishlist/add`

Adds a product to the user's wishlist.

**Request Body:**
```json
{
  "productId": "product_id",
  "variantId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product added to wishlist successfully",
  "data": {
    "wishlist": {
      "_id": "wishlist_id",
      "items": [...],
      "itemCount": 1,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 3. Remove Product from Wishlist
**DELETE** `/api/v1/wishlist/remove`

Removes a specific product from the wishlist.

**Request Body:**
```json
{
  "productId": "product_id",
  "variantId": 1
}
```

### 4. Clear Entire Wishlist
**DELETE** `/api/v1/wishlist/clear`

Removes all products from the wishlist.

**Response:**
```json
{
  "success": true,
  "message": "Wishlist cleared successfully",
  "data": {
    "wishlist": {
      "_id": "wishlist_id",
      "items": [],
      "itemCount": 0,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 5. Check Wishlist Status
**GET** `/api/v1/wishlist/check`

Checks if a specific product is in the user's wishlist.

**Query Parameters:**
- `productId` (required): Product ID to check
- `variantId` (optional): Variant ID to check

**Response:**
```json
{
  "success": true,
  "message": "Wishlist status retrieved successfully",
  "data": {
    "isInWishlist": true,
    "productId": "product_id",
    "variantId": 1
  }
}
```

### 6. Move Product to Cart
**POST** `/api/v1/wishlist/move-to-cart`

Moves a product from wishlist to cart and removes it from wishlist.

**Request Body:**
```json
{
  "productId": "product_id",
  "variantId": 1,
  "quantity": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product moved to cart successfully",
  "data": {
    "cart": {
      "_id": "cart_id",
      "items": [...],
      "subtotal": 160,
      "totalAmount": 160,
      "itemCount": 1
    },
    "wishlist": {
      "_id": "wishlist_id",
      "items": [...],
      "itemCount": 0
    }
  }
}
```

## Features

### Wishlist Features
- ✅ Add/remove products
- ✅ Support for product variants
- ✅ Clear entire wishlist
- ✅ Check if product is in wishlist
- ✅ Move products to cart
- ✅ Automatic item count tracking
- ✅ Product availability validation
- ✅ Duplicate prevention

### Product Validation
- Only public and approved products can be added
- Variant support for multi-variant products
- Stock validation when moving to cart
- Automatic cleanup of unavailable products

### Database Features
- User-specific wishlist storage
- Efficient indexing for fast queries
- Automatic timestamp tracking
- Optimized for performance

## Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Frontend Integration Example

```javascript
// Add to wishlist
const addToWishlist = async (productId, variantId) => {
  const response = await fetch('/api/v1/wishlist/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      variantId
    })
  });
  return response.json();
};

// Check wishlist status
const checkWishlistStatus = async (productId, variantId) => {
  const response = await fetch(`/api/v1/wishlist/check?productId=${productId}&variantId=${variantId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Move to cart
const moveToCart = async (productId, variantId, quantity = 1) => {
  const response = await fetch('/api/v1/wishlist/move-to-cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      variantId,
      quantity
    })
  });
  return response.json();
};
```

## Database Schema

### Wishlist Model
```javascript
{
  userId: ObjectId (ref: User),
  items: [{
    productId: ObjectId (ref: Product),
    variantId: Number,
    addedAt: Date,
    variantDetails: {
      color: String,
      size: String,
      sku: String
    }
  }],
  itemCount: Number,
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Notes

- All timestamps are in ISO format
- Variant ID is optional for single-variant products
- Products are automatically filtered for availability
- Wishlist is created automatically for new users
- Moving to cart includes stock validation
- Duplicate products are prevented automatically
