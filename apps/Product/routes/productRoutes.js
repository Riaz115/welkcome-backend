import express from 'express';
import { 
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    getProductStats
} from '../controllers/productController.js';
import { uploadProductImages, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Product CRUD routes
router.post('/', uploadProductImages, handleUploadError, createProduct); // Create new product with multi-image upload
router.get('/', getAllProducts);                           // GET /api/product - Get all products with filtering & pagination
router.get('/stats', getProductStats);                     // GET /api/product/stats - Get product statistics
router.get('/:id', getProductById);                        // GET /api/product/:id - Get single product by ID
router.put('/:id', uploadProductImages, handleUploadError, updateProduct); // Update product with optional image upload
router.delete('/:id', deleteProduct);                      // DELETE /api/product/:id - Delete product

// Category-based routes
router.get('/category/:primeCategory/:category', getProductsByCategory);           // GET /api/products/category/Electronics/Phones
router.get('/category/:primeCategory/:category/:subCategory', getProductsByCategory); // GET /api/products/category/Electronics/Phones/Smartphones

export default router;
