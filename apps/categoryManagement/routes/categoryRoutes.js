import express from 'express';

// Import controllers
import {
  getAllPrimeCategories,
  getPrimeCategoryById,
  createPrimeCategory,
  updatePrimeCategory,
  deletePrimeCategory
} from '../controllers/primeCategoryController.js';

import {
  getAllCategories,
  getCategoriesByPrimeCategory,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';

import {
  getAllSubcategories,
  getSubcategoriesByCategory,
  createSubcategory,
  deleteSubcategory,
  updateSubcategory
} from '../controllers/subcategoryController.js';

import {
  generateNewSerialNumber,
  getCategoryStatistics,
  getCategoryHierarchy,
  bulkUpdateStatus,
  exportCategoriesData
} from '../controllers/utilsController.js';

// Import middleware
import {
  validateCreatePrimeCategory,
  validateUpdatePrimeCategory,
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateSubcategory,
  validateUpdateSubcategory,
  validateId,
  validateListQuery,
  validateSubcategoryListQuery,
  validatePrimeCategoryId,
  validateCategoryId
} from '../middleware/validation.js';

import {
  uploadCategoryImage,
  handleUploadError,
  validateImageFile
} from '../middleware/upload.js';

const router = express.Router();

// Prime Categories Routes
// GET /api/categories/prime - Get all prime categories
router.get('/prime', validateListQuery, getAllPrimeCategories);

// GET /api/categories/prime/:id - Get prime category by ID
router.get('/prime/:id', validateId, getPrimeCategoryById);

// POST /api/categories/prime - Create prime category
router.post('/prime', 
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  // validateCreatePrimeCategory,
  createPrimeCategory
);

// PUT /api/categories/prime/:id - Update prime category
router.put('/prime/:id',
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  validateUpdatePrimeCategory,
  updatePrimeCategory
);

// DELETE /api/categories/prime/:id - Delete prime category
router.delete('/prime/:id', validateId, deletePrimeCategory);

// Utility Routes (must be before /:id routes)
// GET /api/categories/utils/generate-serial - Generate new serial number
router.get('/utils/generate-serial', generateNewSerialNumber);

// GET /api/categories/utils/statistics - Get category statistics
router.get('/utils/statistics', getCategoryStatistics);

// GET /api/categories/utils/hierarchy - Get category hierarchy
router.get('/utils/hierarchy', getCategoryHierarchy);

// PATCH /api/categories/utils/bulk-status - Bulk update status
router.patch('/utils/bulk-status', bulkUpdateStatus);

// GET /api/categories/utils/export - Export categories data
router.get('/utils/export', exportCategoriesData);

// Subcategories Routes (must be before /:id routes)
// GET /api/categories/subcategories - Get all subcategories
router.get('/subcategories', validateSubcategoryListQuery, getAllSubcategories);

// POST /api/categories/subcategories - Create subcategory
router.post('/subcategories',
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  validateCreateSubcategory,
  createSubcategory
);

// PUT /api/categories/subcategories/:id - Update subcategory
router.put('/subcategories/:id',
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  validateUpdateSubcategory,
  updateSubcategory
);

// DELETE /api/categories/subcategories/:id - Delete subcategory
router.delete('/subcategories/:id', validateId, deleteSubcategory);

// Categories Routes
// GET /api/categories - Get all categories
router.get('/', validateListQuery, getAllCategories);

// GET /api/categories/prime/:primeId/categories - Get categories by prime category
router.get('/prime/:primeId/categories', 
  validatePrimeCategoryId,
  validateListQuery,
  getCategoriesByPrimeCategory
);

// GET /api/categories/:categoryId/subcategories - Get subcategories by category
router.get('/:categoryId/subcategories',
  validateCategoryId,
  validateSubcategoryListQuery,
  getSubcategoriesByCategory
);

// GET /api/categories/:id - Get category by ID
router.get('/:id', validateId, getCategoryById);

// POST /api/categories - Create category
router.post('/',
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  validateCreateCategory,
  createCategory
);

// PUT /api/categories/:id - Update category
router.put('/:id',
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  validateUpdateCategory,
  updateCategory
);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', validateId, deleteCategory);

export default router; 