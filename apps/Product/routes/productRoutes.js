import express from 'express';
import { 
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    getProductStats,
    getProductBySlug,
    getProductsByBrand,
    searchProducts
} from '../controllers/productController.js';
import { 
    uploadProductMedia, 
    uploadProductImages, 
    uploadProductVideos,
    handleUploadError 
} from '../middleware/upload.js';

const router = express.Router();

router.post('/', uploadProductMedia, handleUploadError, createProduct);
router.get('/', getAllProducts);
router.get('/stats', getProductStats);
router.get('/search', searchProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
router.put('/:id', uploadProductMedia, handleUploadError, updateProduct);
router.delete('/:id', deleteProduct);

router.get('/category/:primeCategory/:category', getProductsByCategory);
router.get('/category/:primeCategory/:category/:subCategory', getProductsByCategory);
router.get('/brand/:brandId', getProductsByBrand);

router.post('/legacy', uploadProductImages, handleUploadError, createProduct);

export default router;
