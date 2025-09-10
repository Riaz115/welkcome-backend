# Advanced Product Search API

A comprehensive product search system that allows users to search products using multiple filters including price range, variants, categories, brands, SKU, and more.

## Features

- ✅ **Advanced Text Search** - Search across title, description, brand, tags, variants
- ✅ **Price Range Filtering** - Min/max price and predefined ranges
- ✅ **Discount Filtering** - Percentage and flat discount filters
- ✅ **Variant Search** - Color, size, model, and custom variants
- ✅ **Category Filtering** - Prime category, category, subcategory
- ✅ **Brand Filtering** - Single or multiple brands
- ✅ **SKU Search** - Exact or partial SKU matching
- ✅ **Stock Filtering** - In stock/out of stock products
- ✅ **Quick Search** - Autocomplete functionality
- ✅ **Search Analytics** - Search statistics and insights
- ✅ **Smart Suggestions** - Related search suggestions
- ✅ **Pagination** - Efficient pagination with metadata

## API Endpoints

### Base URL: `/api/v1/search`

### 1. Advanced Product Search
**GET** `/api/v1/search`

**Query Parameters:**

#### Basic Search
- `query` (string): Search term for text search
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `sortBy` (string): Sort field - `createdAt`, `updatedAt`, `title`, `price`, `discount`, `finalPrice`
- `sortOrder` (string): Sort order - `asc` or `desc` (default: `desc`)

#### Category Filters
- `primeCategory` (string): Prime category name
- `category` (string): Category name
- `subcategory` (string): Subcategory name
- `primeCategoryId` (string): Prime category ID
- `categoryId` (string): Category ID
- `subcategoryId` (string): Subcategory ID
- `primeCategories` (string): Comma-separated prime categories
- `categories` (string): Comma-separated categories
- `subcategories` (string): Comma-separated subcategories

#### Price Filters
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `priceRange` (string): Predefined ranges - `under-100`, `100-500`, `500-1000`, `1000-5000`, `above-5000`

#### Discount Filters
- `minDiscount` (number): Minimum discount percentage
- `maxDiscount` (number): Maximum discount percentage
- `discountType` (string): `percentage` or `flat`
- `discountValue` (number): Specific discount value

#### Variant Filters
- `color` (string): Color name
- `size` (string): Size
- `model` (string): Model name
- `variantType` (string): Variant type
- `variantValue` (string): Variant value
- `colors` (string): Comma-separated colors
- `sizes` (string): Comma-separated sizes
- `models` (string): Comma-separated models

#### Brand Filters
- `brand` (string): Brand name
- `brandId` (string): Brand ID
- `brands` (string): Comma-separated brands

#### Other Filters
- `sku` (string): SKU search
- `inStock` (boolean): Filter in-stock products
- `outOfStock` (boolean): Filter out-of-stock products
- `tags` (string): Comma-separated tags
- `weight` (string): Product weight
- `productCollection` (string): Product collection
- `visibility` (string): `public`, `private`, `draft` (default: `public`)
- `status` (string): `pending`, `approved`, `rejected` (default: `approved`)
- `dateFrom` (date): Filter from date (ISO format)
- `dateTo` (date): Filter to date (ISO format)

**Example Request:**
```
GET /api/v1/search?query=red shirt&minPrice=100&maxPrice=500&color=red&size=XL&brand=nike&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Products found successfully",
  "data": {
    "products": [
      {
        "_id": "product_id",
        "title": "Red Nike T-Shirt",
        "brand": "Nike",
        "primeCategory": "Clothing",
        "category": "T-Shirts",
        "subcategory": "Casual",
        "finalPrice": 299,
        "discount": 25,
        "coverImage": "image_url",
        "variants": [
          {
            "id": 1,
            "name": "Red XL",
            "variantType": "Color",
            "variantValue": "Red",
            "size": "XL",
            "sku": "NKE-RED-XL-001",
            "finalPrice": "299",
            "discount": "25",
            "stock": "50"
          }
        ],
        "tags": ["casual", "cotton", "red"],
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 95,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 20
    },
    "searchSuggestions": {
      "brands": [
        { "name": "Nike", "count": 25 },
        { "name": "Adidas", "count": 20 }
      ],
      "categories": [
        {
          "primeCategory": "Clothing",
          "category": "T-Shirts",
          "count": 45
        }
      ],
      "colors": [
        { "name": "Red", "count": 15 },
        { "name": "Blue", "count": 12 }
      ],
      "sizes": [
        { "name": "XL", "count": 20 },
        { "name": "L", "count": 18 }
      ]
    },
    "availableFilters": {
      "priceRange": {
        "min": 50,
        "max": 2000,
        "ranges": []
      },
      "discountRange": {
        "min": 0,
        "max": 70
      },
      "brands": [],
      "categories": [],
      "colors": [],
      "sizes": []
    },
    "appliedFilters": {
      "query": "red shirt",
      "minPrice": 100,
      "maxPrice": 500,
      "color": "red",
      "size": "XL",
      "brand": "nike"
    }
  }
}
```

### 2. Quick Search (Autocomplete)
**GET** `/api/v1/search/quick`

**Query Parameters:**
- `query` (string, required): Search term (min 2 characters)
- `limit` (number): Results limit (default: 10, max: 50)

**Example Request:**
```
GET /api/v1/search/quick?query=red&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Quick search completed",
  "data": {
    "suggestions": [
      {
        "id": "product_id",
        "title": "Red Nike T-Shirt",
        "brand": "Nike",
        "category": "Clothing > T-Shirts",
        "price": 299,
        "image": "image_url",
        "variants": [
          {
            "variantValue": "Red",
            "size": "XL",
            "finalPrice": "299"
          }
        ]
      }
    ],
    "total": 8
  }
}
```

### 3. SKU Search
**GET** `/api/v1/search/sku`

**Query Parameters:**
- `sku` (string, required): SKU to search
- `exact` (boolean): Exact match (default: false)

**Example Request:**
```
GET /api/v1/search/sku?sku=NKE-RED-XL-001&exact=true
```

**Response:**
```json
{
  "success": true,
  "message": "SKU search completed",
  "data": {
    "products": [
      {
        "_id": "product_id",
        "title": "Red Nike T-Shirt",
        "sku": "NKE-RED-XL-001",
        "variants": [
          {
            "sku": "NKE-RED-XL-001",
            "variantValue": "Red",
            "size": "XL",
            "finalPrice": "299"
          }
        ]
      }
    ],
    "total": 1
  }
}
```

### 4. Search Analytics
**GET** `/api/v1/search/analytics`

**Query Parameters:**
- `dateFrom` (date, optional): Start date (ISO format)
- `dateTo` (date, optional): End date (ISO format)

**Example Request:**
```
GET /api/v1/search/analytics?dateFrom=2024-01-01&dateTo=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "message": "Search analytics retrieved",
  "data": {
    "totalProducts": 1250,
    "totalVariants": 3750,
    "avgPrice": 450.75,
    "minPrice": 50,
    "maxPrice": 2000,
    "uniqueBrands": 45,
    "uniqueCategories": 12
  }
}
```

## Search Examples

### 1. Basic Text Search
```
GET /api/v1/search?query=red shirt
```

### 2. Price Range Search
```
GET /api/v1/search?minPrice=100&maxPrice=500
```

### 3. Category + Brand Search
```
GET /api/v1/search?primeCategory=Clothing&category=T-Shirts&brand=Nike
```

### 4. Variant Search
```
GET /api/v1/search?color=red&size=XL&model=printed
```

### 5. Discount Search
```
GET /api/v1/search?minDiscount=20&maxDiscount=50
```

### 6. Stock Search
```
GET /api/v1/search?inStock=true
```

### 7. Complex Search
```
GET /api/v1/search?query=shirt&primeCategory=Clothing&minPrice=100&maxPrice=1000&color=red&size=XL&brand=Nike&inStock=true&sortBy=price&sortOrder=asc
```

### 8. Multiple Values Search
```
GET /api/v1/search?colors=red,blue,green&sizes=S,M,L,XL&brands=Nike,Adidas,Puma
```

## Search Features Explained

### Text Search
The search system performs text search across multiple fields:
- Product title
- Product description
- Brand name
- Tags
- Variant names and values
- SKU
- Model values
- Custom variant values

### Variant Search
Products can be searched by their variants:
- **Color**: Search by color name or variant value
- **Size**: Search by size (S, M, L, XL, etc.)
- **Model**: Search by model type (printed, plain, etc.)
- **Custom Variants**: Search by any custom variant type

### Price Filtering
- **Range**: Set minimum and maximum price
- **Predefined Ranges**: Use predefined price ranges
- **Variant Prices**: Search includes variant-specific prices

### Discount Filtering
- **Percentage**: Filter by discount percentage
- **Flat Amount**: Filter by flat discount amount
- **Range**: Set minimum and maximum discount

### Category Hierarchy
- **Prime Category**: Top-level category
- **Category**: Second-level category
- **Subcategory**: Third-level category
- **Multiple Selection**: Search across multiple categories

### Smart Suggestions
The search system provides:
- **Brand Suggestions**: Popular brands in results
- **Category Suggestions**: Relevant categories
- **Color Suggestions**: Available colors
- **Size Suggestions**: Available sizes
- **Price Ranges**: Suggested price ranges

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Search validation failed",
  "errors": [
    {
      "field": "minPrice",
      "message": "Minimum price cannot be negative"
    }
  ]
}
```

### Server Error
```json
{
  "success": false,
  "message": "Search failed",
  "error": "Internal server error"
}
```

## Performance Tips

1. **Use Indexes**: The system uses MongoDB indexes for optimal performance
2. **Limit Results**: Use pagination to limit results
3. **Specific Filters**: Use specific filters to narrow down results
4. **Cache Results**: Implement caching for frequently searched terms
5. **Text Search**: Use specific keywords for better text search results

## Frontend Integration

### JavaScript Example
```javascript
// Advanced search
const searchProducts = async (filters) => {
  const params = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== '') {
      params.append(key, filters[key]);
    }
  });
  
  const response = await fetch(`/api/v1/search?${params}`);
  return response.json();
};

// Quick search for autocomplete
const quickSearch = async (query) => {
  const response = await fetch(`/api/v1/search/quick?query=${encodeURIComponent(query)}`);
  return response.json();
};

// Usage examples
const results = await searchProducts({
  query: 'red shirt',
  minPrice: 100,
  maxPrice: 500,
  color: 'red',
  size: 'XL',
  brand: 'Nike',
  page: 1,
  limit: 20
});

const suggestions = await quickSearch('red');
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

const useProductSearch = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (filters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const response = await fetch(`/api/v1/search?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
};
```

## Notes

- All search endpoints are public (no authentication required)
- Results are limited to approved and public products by default
- The system supports complex queries with multiple filters
- Search suggestions help users discover related products
- Analytics provide insights into product catalog
- The search system is optimized for performance with proper indexing
