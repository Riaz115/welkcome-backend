import Joi from 'joi';

// Search validation schema
export const searchValidationSchema = Joi.object({
  // Basic search
  query: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .messages({
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query cannot exceed 200 characters'
    }),

  // Category filters
  primeCategory: Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Prime category cannot exceed 100 characters'
    }),

  category: Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Category cannot exceed 100 characters'
    }),

  subcategory: Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Subcategory cannot exceed 100 characters'
    }),

  primeCategoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid prime category ID format'
    }),

  categoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid category ID format'
    }),

  subcategoryId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid subcategory ID format'
    }),

  // Price filters
  minPrice: Joi.number()
    .min(0)
    .messages({
      'number.min': 'Minimum price cannot be negative',
      'number.base': 'Minimum price must be a valid number'
    }),

  maxPrice: Joi.number()
    .min(0)
    .messages({
      'number.min': 'Maximum price cannot be negative',
      'number.base': 'Maximum price must be a valid number'
    }),

  priceRange: Joi.string()
    .valid('under-100', '100-500', '500-1000', '1000-5000', 'above-5000')
    .messages({
      'any.only': 'Invalid price range. Valid ranges: under-100, 100-500, 500-1000, 1000-5000, above-5000'
    }),

  // Discount filters
  minDiscount: Joi.number()
    .min(0)
    .max(100)
    .messages({
      'number.min': 'Minimum discount cannot be negative',
      'number.max': 'Minimum discount cannot exceed 100%',
      'number.base': 'Minimum discount must be a valid number'
    }),

  maxDiscount: Joi.number()
    .min(0)
    .max(100)
    .messages({
      'number.min': 'Maximum discount cannot be negative',
      'number.max': 'Maximum discount cannot exceed 100%',
      'number.base': 'Maximum discount must be a valid number'
    }),

  discountType: Joi.string()
    .valid('percentage', 'flat')
    .messages({
      'any.only': 'Discount type must be either "percentage" or "flat"'
    }),

  discountValue: Joi.number()
    .min(0)
    .messages({
      'number.min': 'Discount value cannot be negative',
      'number.base': 'Discount value must be a valid number'
    }),

  // Variant filters
  color: Joi.string()
    .trim()
    .max(50)
    .messages({
      'string.max': 'Color cannot exceed 50 characters'
    }),

  size: Joi.string()
    .trim()
    .max(20)
    .messages({
      'string.max': 'Size cannot exceed 20 characters'
    }),

  model: Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Model cannot exceed 100 characters'
    }),

  variantType: Joi.string()
    .trim()
    .max(50)
    .messages({
      'string.max': 'Variant type cannot exceed 50 characters'
    }),

  variantValue: Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Variant value cannot exceed 100 characters'
    }),

  // Brand filters
  brand: Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Brand cannot exceed 100 characters'
    }),

  brandId: Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Brand ID cannot exceed 100 characters'
    }),

  // SKU search
  sku: Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'SKU cannot exceed 100 characters'
    }),

  // Stock filters
  inStock: Joi.boolean()
    .messages({
      'boolean.base': 'In stock filter must be true or false'
    }),

  outOfStock: Joi.boolean()
    .messages({
      'boolean.base': 'Out of stock filter must be true or false'
    }),

  // Product attributes
  tags: Joi.string()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Tags cannot exceed 500 characters'
    }),

  weight: Joi.string()
    .trim()
    .max(50)
    .messages({
      'string.max': 'Weight cannot exceed 50 characters'
    }),

  productCollection: Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Product collection cannot exceed 100 characters'
    }),

  // Sorting and pagination
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'title', 'price', 'discount', 'finalPrice')
    .default('createdAt')
    .messages({
      'any.only': 'Invalid sort field. Valid fields: createdAt, updatedAt, title, price, discount, finalPrice'
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either "asc" or "desc"'
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
      'number.base': 'Page must be a valid number'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
      'number.base': 'Limit must be a valid number'
    }),

  // Advanced filters
  visibility: Joi.string()
    .valid('public', 'private', 'draft')
    .default('public')
    .messages({
      'any.only': 'Visibility must be public, private, or draft'
    }),

  status: Joi.string()
    .valid('pending', 'approved', 'rejected')
    .default('approved')
    .messages({
      'any.only': 'Status must be pending, approved, or rejected'
    }),

  // Date filters
  dateFrom: Joi.date()
    .iso()
    .messages({
      'date.format': 'Date from must be in ISO format (YYYY-MM-DD)',
      'date.base': 'Date from must be a valid date'
    }),

  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .messages({
      'date.format': 'Date to must be in ISO format (YYYY-MM-DD)',
      'date.min': 'Date to must be after date from',
      'date.base': 'Date to must be a valid date'
    }),

  // Multiple values (comma separated)
  colors: Joi.string()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Colors list cannot exceed 500 characters'
    }),

  sizes: Joi.string()
    .trim()
    .max(200)
    .messages({
      'string.max': 'Sizes list cannot exceed 200 characters'
    }),

  models: Joi.string()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Models list cannot exceed 500 characters'
    }),

  brands: Joi.string()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Brands list cannot exceed 500 characters'
    }),

  primeCategories: Joi.string()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Prime categories list cannot exceed 500 characters'
    }),

  categories: Joi.string()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Categories list cannot exceed 500 characters'
    }),

  subcategories: Joi.string()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Subcategories list cannot exceed 500 characters'
    })
});

// Quick search validation schema
export const quickSearchValidationSchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Search query is required',
      'string.min': 'Search query must be at least 2 characters long',
      'string.max': 'Search query cannot exceed 100 characters'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50',
      'number.base': 'Limit must be a valid number'
    })
});

// SKU search validation schema
export const skuSearchValidationSchema = Joi.object({
  sku: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'SKU is required',
      'string.min': 'SKU must be at least 1 character long',
      'string.max': 'SKU cannot exceed 100 characters'
    }),

  exact: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Exact search must be true or false'
    })
});

// Analytics validation schema
export const analyticsValidationSchema = Joi.object({
  dateFrom: Joi.date()
    .iso()
    .messages({
      'date.format': 'Date from must be in ISO format (YYYY-MM-DD)',
      'date.base': 'Date from must be a valid date'
    }),

  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .messages({
      'date.format': 'Date to must be in ISO format (YYYY-MM-DD)',
      'date.min': 'Date to must be after date from',
      'date.base': 'Date to must be a valid date'
    })
});

// Validation middleware function
export const validateSearch = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Search validation failed',
        errors: errorMessages
      });
    }

    // Convert string numbers to actual numbers
    if (value.minPrice) value.minPrice = Number(value.minPrice);
    if (value.maxPrice) value.maxPrice = Number(value.maxPrice);
    if (value.minDiscount) value.minDiscount = Number(value.minDiscount);
    if (value.maxDiscount) value.maxDiscount = Number(value.maxDiscount);
    if (value.discountValue) value.discountValue = Number(value.discountValue);
    if (value.page) value.page = Number(value.page);
    if (value.limit) value.limit = Number(value.limit);

    // Convert string booleans to actual booleans
    if (value.inStock !== undefined) value.inStock = value.inStock === 'true';
    if (value.outOfStock !== undefined) value.outOfStock = value.outOfStock === 'true';
    if (value.exact !== undefined) value.exact = value.exact === 'true';

    req.query = value;
    next();
  };
};

// Helper function to validate price range
export const validatePriceRange = (minPrice, maxPrice) => {
  if (minPrice && maxPrice && minPrice > maxPrice) {
    throw new Error('Minimum price cannot be greater than maximum price');
  }
  return true;
};

// Helper function to validate discount range
export const validateDiscountRange = (minDiscount, maxDiscount) => {
  if (minDiscount && maxDiscount && minDiscount > maxDiscount) {
    throw new Error('Minimum discount cannot be greater than maximum discount');
  }
  return true;
};

// Helper function to validate date range
export const validateDateRange = (dateFrom, dateTo) => {
  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    throw new Error('Date from cannot be after date to');
  }
  return true;
};

// Helper function to parse comma-separated values
export const parseCommaSeparated = (value) => {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

// Helper function to validate search query complexity
export const validateSearchComplexity = (query) => {
  if (!query) return true;
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
    /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/i
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(query)) {
      throw new Error('Invalid search query detected');
    }
  }

  return true;
};
