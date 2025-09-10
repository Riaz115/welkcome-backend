# Address Management API

A comprehensive address management system for ecommerce applications. This system allows users to manage multiple addresses with full CRUD operations.

## Features

- ✅ Create, Read, Update, Delete addresses
- ✅ Set default address
- ✅ Search addresses by location
- ✅ Address statistics
- ✅ Bulk operations
- ✅ Flexible for any country (not restricted to Uganda)
- ✅ GPS coordinates support
- ✅ Delivery instructions
- ✅ Soft delete functionality

## API Endpoints

### Base URL: `/api/v1/addresses`

All endpoints require authentication (`isLoggedIn` middleware).

### 1. Create Address
**POST** `/api/v1/addresses`

**Request Body:**
```json
{
  "contactName": "John Doe",
  "contactPhone": "+256700123456",
  "country": "Uganda",
  "state": "Central Region",
  "city": "Kampala",
  "area": "Nakawa",
  "streetAddress": "Plot 123, Main Street",
  "buildingName": "ABC Building",
  "houseNumber": "H-45",
  "apartmentNumber": "Apt 2B",
  "postalCode": "256",
  "landmark": "Near City Mall",
  "coordinates": {
    "latitude": 0.3476,
    "longitude": 32.5825
  },
  "isDefault": false,
  "deliveryInstructions": "Call before delivery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address created successfully",
  "data": {
    "_id": "address_id",
    "userId": "user_id",
    "contactName": "John Doe",
    "contactPhone": "+256700123456",
    "country": "Uganda",
    "state": "Central Region",
    "city": "Kampala",
    "area": "Nakawa",
    "streetAddress": "Plot 123, Main Street",
    "buildingName": "ABC Building",
    "houseNumber": "H-45",
    "apartmentNumber": "Apt 2B",
    "postalCode": "256",
    "landmark": "Near City Mall",
    "coordinates": {
      "latitude": 0.3476,
      "longitude": 32.5825
    },
    "isDefault": false,
    "deliveryInstructions": "Call before delivery",
    "isActive": true,
    "fullAddress": "H-45, Apt 2B, ABC Building, Plot 123, Main Street, Nakawa, Kampala, Central Region, 256, Uganda",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Addresses
**GET** `/api/v1/addresses`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `country` (optional): Filter by country
- `city` (optional): Filter by city

**Response:**
```json
{
  "success": true,
  "data": {
    "addresses": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalAddresses": 15,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 3. Get Address by ID
**GET** `/api/v1/addresses/:addressId`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "address_id",
    "userId": "user_id",
    "contactName": "John Doe",
    // ... other address fields
  }
}
```

### 4. Update Address
**PUT** `/api/v1/addresses/:addressId`

**Request Body:** (All fields optional)
```json
{
  "contactName": "John Smith",
  "city": "Entebbe",
  "isDefault": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    // Updated address object
  }
}
```

### 5. Delete Address
**DELETE** `/api/v1/addresses/:addressId`

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

### 6. Set Default Address
**PATCH** `/api/v1/addresses/:addressId/default`

**Response:**
```json
{
  "success": true,
  "message": "Default address updated successfully",
  "data": {
    // Updated address object with isDefault: true
  }
}
```

### 7. Get Default Address
**GET** `/api/v1/addresses/default`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "address_id",
    "isDefault": true,
    // ... other address fields
  }
}
```

### 8. Get Address Statistics
**GET** `/api/v1/addresses/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAddresses": 5,
    "countries": ["Uganda", "Kenya"],
    "cities": ["Kampala", "Nairobi", "Entebbe"],
    "hasDefault": true,
    "uniqueCountries": 2,
    "uniqueCities": 3
  }
}
```

### 9. Search Addresses
**GET** `/api/v1/addresses/search`

**Query Parameters:**
- `country` (optional): Search by country
- `state` (optional): Search by state
- `city` (optional): Search by city
- `query` (optional): Search in address fields

**Response:**
```json
{
  "success": true,
  "data": [
    // Array of matching addresses
  ]
}
```

### 10. Bulk Operations
**POST** `/api/v1/addresses/bulk`

**Request Body:**
```json
{
  "operations": [
    {
      "action": "update",
      "addressId": "address_id_1",
      "data": {
        "city": "Updated City"
      }
    },
    {
      "action": "delete",
      "addressId": "address_id_2"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk operations completed",
  "data": [
    {
      "addressId": "address_id_1",
      "success": true,
      "data": { /* updated address */ }
    },
    {
      "addressId": "address_id_2",
      "success": true,
      "message": "Address deleted"
    }
  ]
}
```

## Address Model Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contactName` | String | Yes | Name of the contact person |
| `contactPhone` | String | Yes | Phone number with country code |
| `country` | String | Yes | Country name |
| `state` | String | No | State/Province/Region |
| `city` | String | Yes | City name |
| `area` | String | No | Area/Neighborhood |
| `streetAddress` | String | Yes | Street address details |
| `buildingName` | String | No | Building name |
| `houseNumber` | String | No | House number |
| `apartmentNumber` | String | No | Apartment number |
| `postalCode` | String | No | Postal/ZIP code |
| `landmark` | String | No | Nearby landmark |
| `coordinates` | Object | No | GPS coordinates (lat, lng) |
| `isDefault` | Boolean | No | Default address flag |
| `deliveryInstructions` | String | No | Special delivery instructions |

## Validation Rules

- `contactName`: 2-100 characters
- `contactPhone`: 10-20 characters, numbers and +,-,(),spaces only
- `country`: 2-100 characters, required
- `city`: 2-100 characters, required
- `streetAddress`: 5-300 characters, required
- `postalCode`: Max 20 characters
- `landmark`: Max 200 characters
- `deliveryInstructions`: Max 300 characters

## Error Responses

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "contactName",
      "message": "Contact name is required"
    }
  ]
}
```

## Usage Examples

### Frontend Integration

```javascript
// Create a new address
const createAddress = async (addressData) => {
  const response = await fetch('/api/v1/addresses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(addressData)
  });
  return response.json();
};

// Get user addresses
const getAddresses = async (page = 1, limit = 10) => {
  const response = await fetch(`/api/v1/addresses?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Set default address
const setDefaultAddress = async (addressId) => {
  const response = await fetch(`/api/v1/addresses/${addressId}/default`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## Notes

- All addresses are soft-deleted (marked as `isActive: false`)
- Only one address can be default at a time
- Addresses are sorted by default status first, then by creation date
- The `fullAddress` virtual field provides a formatted address string
- GPS coordinates are optional but useful for delivery optimization
- The system is flexible and works for any country, not just Uganda
