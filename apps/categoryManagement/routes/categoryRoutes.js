import express from 'express';
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

router.get('/all-prime', getAllPrimeCategories);
router.get('/all-categories', getAllCategories);
router.get('/all-subcategories', getAllSubcategories);
router.get('/prime', validateListQuery, getAllPrimeCategories);
router.get('/prime/:id', validateId, getPrimeCategoryById);
router.post('/prime', 
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  createPrimeCategory
);
router.put('/prime/:id',
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  validateUpdatePrimeCategory,
  updatePrimeCategory
);
router.delete('/prime/:id', validateId, deletePrimeCategory);

router.get('/utils/generate-serial', generateNewSerialNumber);
router.get('/utils/statistics', getCategoryStatistics);
router.get('/utils/hierarchy', getCategoryHierarchy);
router.patch('/utils/bulk-status', bulkUpdateStatus);
router.get('/utils/export', exportCategoriesData);

router.get('/subcategories', validateSubcategoryListQuery, getAllSubcategories);
router.post('/subcategories',
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  validateCreateSubcategory,
  createSubcategory
);
router.put('/subcategories/:id',
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  validateUpdateSubcategory,
  updateSubcategory
);
router.delete('/subcategories/:id', validateId, deleteSubcategory);

router.get('/', validateListQuery, getAllCategories);
router.get('/prime/:primeId/categories', 
  validatePrimeCategoryId,
  validateListQuery,
  getCategoriesByPrimeCategory
);
router.get('/:categoryId/subcategories',
  validateCategoryId,
  validateSubcategoryListQuery,
  getSubcategoriesByCategory
);
router.get('/:id', validateId, getCategoryById);
router.post('/',
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  validateCreateCategory,
  createCategory
);
router.put('/:id',
  uploadCategoryImage,
  handleUploadError,
  validateImageFile,
  validateUpdateCategory,
  updateCategory
);
router.delete('/:id', validateId, deleteCategory);

export default router; 