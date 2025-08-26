import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { validateSerialNumber, isSerialNumberUnique } from '../utils/serialGenerator.js';
import PrimeCategory from '../models/PrimeCategory.js';
import Category from '../models/Category.js';

// Validation helper to check ObjectId format
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }
  next();
};

// Prime Category Validations
export const validateCreatePrimeCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Prime category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Prime category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&'-]+$/)
    .withMessage('Prime category name contains invalid characters'),
  
  body('serialNumber')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !validateSerialNumber(value)) {
        throw new Error('Invalid serial number format. Use format: ABC12345');
      }
      return true;
    }),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  handleValidationErrors
];

export const validateUpdatePrimeCategory = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid prime category ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Prime category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&'-]+$/)
    .withMessage('Prime category name contains invalid characters'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  handleValidationErrors
];

// Category Validations
export const validateCreateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&'-]+$/)
    .withMessage('Category name contains invalid characters'),
  
  body('primeCategoryId')
    .notEmpty()
    .withMessage('Prime category ID is required')
    .custom(isValidObjectId)
    .withMessage('Invalid prime category ID')
    .custom(async (value) => {
      const primeCategory = await PrimeCategory.findById(value);
      if (!primeCategory) {
        throw new Error('Prime category not found');
      }
      return true;
    }),
  
  body('serialNumber')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !validateSerialNumber(value)) {
        throw new Error('Invalid serial number format. Use format: ABC12345');
      }
      return true;
    }),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  handleValidationErrors
];

export const validateUpdateCategory = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid category ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&'-]+$/)
    .withMessage('Category name contains invalid characters'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  handleValidationErrors
];

// Subcategory Validations
export const validateCreateSubcategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subcategory name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subcategory name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&'-]+$/)
    .withMessage('Subcategory name contains invalid characters'),
  
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .custom(isValidObjectId)
    .withMessage('Invalid category ID')
    .custom(async (value) => {
      const category = await Category.findById(value);
      if (!category) {
        throw new Error('Category not found');
      }
      return true;
    }),
  
  body('productCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Product count must be a non-negative integer'),
  
  body('stockStatus')
    .optional()
    .isIn(['In Stock', 'Out of Stock'])
    .withMessage('Stock status must be either "In Stock" or "Out of Stock"'),
  
  body('serialNumber')
    .optional()
    .trim()
    .custom((value) => {
      if (value && !validateSerialNumber(value)) {
        throw new Error('Invalid serial number format. Use format: ABC12345');
      }
      return true;
    }),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  handleValidationErrors
];

export const validateUpdateSubcategory = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid subcategory ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Subcategory name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&'-]+$/)
    .withMessage('Subcategory name contains invalid characters'),
  
  body('productCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Product count must be a non-negative integer'),
  
  body('stockStatus')
    .optional()
    .isIn(['In Stock', 'Out of Stock'])
    .withMessage('Stock status must be either "In Stock" or "Out of Stock"'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  handleValidationErrors
];

// General ID validation
export const validateId = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Query parameter validations for listing endpoints
export const validateListQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  
  query('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt', 'status'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
  
  handleValidationErrors
];

// Validation for subcategory specific queries
export const validateSubcategoryListQuery = [
  ...validateListQuery,
  
  query('stockStatus')
    .optional()
    .isIn(['In Stock', 'Out of Stock'])
    .withMessage('Stock status must be either "In Stock" or "Out of Stock"'),
  
  query('categoryId')
    .optional()
    .custom(isValidObjectId)
    .withMessage('Invalid category ID'),
  
  handleValidationErrors
];

// Validation for prime category ID in nested routes
export const validatePrimeCategoryId = [
  param('primeId')
    .custom(isValidObjectId)
    .withMessage('Invalid prime category ID')
    .custom(async (value) => {
      const primeCategory = await PrimeCategory.findById(value);
      if (!primeCategory) {
        throw new Error('Prime category not found');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validation for category ID in nested routes
export const validateCategoryId = [
  param('categoryId')
    .custom(isValidObjectId)
    .withMessage('Invalid category ID')
    .custom(async (value) => {
      const category = await Category.findById(value);
      if (!category) {
        throw new Error('Category not found');
      }
      return true;
    }),
  
  handleValidationErrors
]; 