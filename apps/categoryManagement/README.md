# Category Management API

A complete three-tier category management system with Prime Categories → Categories → Subcategories hierarchy.

## Overview

This module provides a comprehensive category management system that supports:
- **Prime Categories**: Top-level categories (e.g., Electronics, Clothing)
- **Categories**: Second-level categories (e.g., Smartphones, Laptops under Electronics)
- **Subcategories**: Third-level categories with product tracking (e.g., iPhone Series, Samsung Galaxy under Smartphones)

## Features

### Core Features
- ✅ **Three-tier hierarchical structure**
- ✅ **CRUD operations** for all category levels
- ✅ **Auto-generated serial numbers** (format: ABC12345)
- ✅ **Image upload support** with validation
- ✅ **Comprehensive validation** using express-validator
- ✅ **Product count tracking** for subcategories
- ✅ **Stock status management** (In Stock/Out of Stock)
- ✅ **Status management** (Active/Inactive)
- ✅ **Search and filtering** capabilities
- ✅ **Pagination** support

### Advanced Features
- ✅ **Statistics dashboard** with comprehensive metrics
- ✅ **Category hierarchy** visualization
- ✅ **Bulk operations** for status updates
- ✅ **Data export** functionality
- ✅ **Cascade delete protection**
- ✅ **Virtual fields** for computed values

## Directory Structure

```
categoryManagement/
├── controllers/
│   ├── primeCategoryController.js    # Prime category operations
│   ├── categoryController.js         # Category operations
│   ├── subcategoryController.js      # Subcategory operations
│   └── utilsController.js           # Utility endpoints
├── models/
│   ├── PrimeCategory.js             # Prime category schema
│   ├── Category.js                  # Category schema
│   └── Subcategory.js               # Subcategory schema
├── middleware/
│   ├── validation.js                # Input validation
│   └── upload.js                    # Image upload handling
├── utils/
│   └── serialGenerator.js           # Serial number utilities
├── routes/
│   └── categoryRoutes.js            # All API routes
└── README.md                        # This file
```

## API Endpoints

### Prime Categories
```
GET    /api/categories/prime                    # Get all prime categories
GET    /api/categories/prime/:id                # Get prime category by ID
POST   /api/categories/prime                    # Create prime category
PUT    /api/categories/prime/:id                # Update prime category
DELETE /api/categories/prime/:id                # Delete prime category
```

### Categories
```
GET    /api/categories                          # Get all categories
GET    /api/categories/prime/:primeId/categories # Get categories by prime category
GET    /api/categories/:id                      # Get category by ID
POST   /api/categories                          # Create category
PUT    /api/categories/:id                      # Update category
DELETE /api/categories/:id                      # Delete category
```

### Subcategories
```
GET    /api/categories/subcategories            # Get all subcategories
GET    /api/categories/:categoryId/subcategories # Get subcategories by category
POST   /api/categories/subcategories            # Create subcategory
DELETE /api/categories/subcategories/:id        # Delete subcategory
```

### Utility Endpoints
```
GET    /api/categories/utils/generate-serial    # Generate new serial number
GET    /api/categories/utils/statistics         # Get category statistics
GET    /api/categories/utils/hierarchy          # Get category hierarchy
PATCH  /api/categories/utils/bulk-status        # Bulk update status
GET    /api/categories/utils/export             # Export categories data
```

## Request/Response Examples

### Create Prime Category
```javascript
// POST /api/categories/prime
// Content-Type: multipart/form-data

FormData:
- name: "Electronics"
- serialNumber: "ELC12345" (optional)
- status: "Active" (optional)
- image: File (optional)

Response:
{
  "success": true,
  "message": "Prime category created successfully",
  "data": {
    "id": "64f1b2c3d4e5f6a7b8c9d0e1",
    "name": "Electronics",
    "serialNumber": "ELC12345",
    "image": "http://localhost:3000/uploads/categories/electronics-1234567890.jpg",
    "status": "Active",
    "categoryCount": 0,
    "totalProducts": 0,
    "createdAt": "2023-09-01T10:00:00.000Z",
    "updatedAt": "2023-09-01T10:00:00.000Z"
  }
}
```

### Get Categories with Filtering
```javascript
// GET /api/categories?page=1&limit=10&search=phone&status=Active&primeCategoryId=64f1b2c3d4e5f6a7b8c9d0e1

Response:
{
  "success": true,
  "data": [
    {
      "_id": "64f1b2c3d4e5f6a7b8c9d0e2",
      "name": "Smartphones",
      "serialNumber": "SPH12345",
      "image": "http://localhost:3000/uploads/categories/smartphone.jpg",
      "status": "Active",
      "categoryCount": 4,
      "totalProducts": 150,
      "primeCategory": {
        "_id": "64f1b2c3d4e5f6a7b8c9d0e1",
        "name": "Electronics"
      },
      "createdAt": "2023-09-01T10:30:00.000Z",
      "updatedAt": "2023-09-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Statistics
```javascript
// GET /api/categories/utils/statistics

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalPrimeCategories": 4,
      "totalCategories": 15,
      "totalSubcategories": 45,
      "totalProducts": 1250
    },
    "status": {
      "active": {
        "primeCategories": 3,
        "categories": 12,
        "subcategories": 38
      },
      "inactive": {
        "primeCategories": 1,
        "categories": 3,
        "subcategories": 7
      }
    },
    "stock": {
      "inStock": 35,
      "outOfStock": 10
    },
    "recentActivity": {
      "primeCategories": 1,
      "categories": 3,
      "subcategories": 8,
      "period": "30 days"
    },
    "topCategories": [
      {
        "_id": "64f1b2c3d4e5f6a7b8c9d0e2",
        "name": "Smartphones",
        "totalProducts": 150,
        "subcategories": 4
      }
    ]
  }
}
```

## Query Parameters

### Common Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search by name (case-insensitive)
- `status`: Filter by status (Active/Inactive)
- `sortBy`: Sort field (name, createdAt, updatedAt, status)
- `sortOrder`: Sort order (asc/desc, default: desc)

### Subcategory Specific
- `stockStatus`: Filter by stock status (In Stock/Out of Stock)
- `categoryId`: Filter by category ID

### Special Parameters
- `include`: Include related data (e.g., `?include=categories,subcategories`)
- `includeInactive`: Include inactive items in hierarchy (true/false)

## Validation Rules

### Name Validation
- Required for all create operations
- 2-100 characters
- Alphanumeric with spaces, ampersands, apostrophes, and hyphens
- Case-insensitive uniqueness check within scope

### Serial Number Validation
- Format: 2-3 letters + 4-6 numbers (e.g., "ABC12345")
- Auto-generated if not provided
- Must be unique across all category types

### Image Validation
- Optional for all operations
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum size: 5MB
- Stored in `/uploads/categories/`

### Product Count (Subcategories)
- Non-negative integer
- Auto-updates stock status (0 = Out of Stock)

## Error Handling

### Standard Error Response
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Unique constraint violation
- `PRIME_CATEGORY_HAS_CATEGORIES`: Cannot delete prime category with categories
- `CATEGORY_HAS_SUBCATEGORIES`: Cannot delete category with subcategories
- `FILE_SIZE_LIMIT`: Image file too large
- `INVALID_FILE_TYPE`: Unsupported file format
- `INTERNAL_SERVER_ERROR`: Server error

## Database Schema

### Relationships
```
PrimeCategory (1) → (n) Category (1) → (n) Subcategory
```

### Indexes
- `name` + `primeCategoryId` (compound, unique for Categories)
- `name` + `categoryId` (compound, unique for Subcategories)
- `serialNumber` (unique across all models)
- `status`, `stockStatus`, `createdAt` (individual indexes)

### Virtual Fields
- `categoryCount`: Count of child categories/subcategories
- `totalProducts`: Sum of product counts in hierarchy

## Installation & Usage

### Prerequisites
- MongoDB
- Node.js
- Express.js
- Mongoose
- Multer (for file uploads)
- express-validator

### Required Dependencies
```json
{
  "mongoose": "^7.0.0",
  "express": "^4.18.0",
  "multer": "^1.4.0",
  "express-validator": "^6.14.0",
  "bcrypt": "^5.1.0"
}
```

### Integration
1. Import the routes in your main app:
```javascript
import categoryRoutes from './apps/categoryManagement/routes/categoryRoutes.js';
app.use('/api/categories', categoryRoutes);
```

2. Ensure uploads directory exists:
```javascript
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads', 'categories');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
```

3. Serve static files:
```javascript
app.use('/uploads', express.static('uploads'));
```

### Environment Variables
```env
BASE_URL=http://localhost:3000
```

## Frontend Integration

This API is designed to work seamlessly with the provided React frontend. The response format matches exactly what the frontend expects:

- Serial numbers are auto-generated with the same algorithm
- Image URLs are returned in the expected format
- Status and stock status enums match frontend expectations
- Pagination format matches the table component requirements

## Performance Considerations

### Optimizations Implemented
- MongoDB aggregation pipelines for complex queries
- Proper indexing for fast lookups
- Virtual fields for computed values
- Efficient cascade delete checks
- File cleanup on errors

### Recommended Practices
- Use pagination for large datasets
- Implement caching for frequently accessed data
- Consider read replicas for high-traffic scenarios
- Regular index maintenance

## Security Notes

- Input validation on all endpoints
- File type and size validation for uploads
- Proper error handling without data leakage
- ObjectId validation for all ID parameters
- Sanitized database queries

## Future Enhancements

- [ ] Bulk import/export with CSV support
- [ ] Image resizing and thumbnail generation
- [ ] Soft delete implementation
- [ ] Audit logging for changes
- [ ] Category templates
- [ ] Advanced search with filters
- [ ] Category analytics and insights
- [ ] Integration with product management 