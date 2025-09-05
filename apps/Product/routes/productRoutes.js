import express from 'express';
import { 
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    approveProduct,
    rejectProduct,
    getProductsBySeller
} from '../controllers/productController.js';
import { 
    uploadProductMedia, 
    handleUploadError 
} from '../middleware/upload.js';
import { verifyToken, requireAdminOrSeller, requireAdmin } from '../../seller/middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, requireAdminOrSeller, uploadProductMedia, handleUploadError, createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', verifyToken, requireAdminOrSeller, uploadProductMedia, handleUploadError, updateProduct);
router.delete('/:id', verifyToken, requireAdminOrSeller, deleteProduct);

router.patch('/:id/approve', verifyToken, requireAdmin, approveProduct);
router.patch('/:id/reject', verifyToken, requireAdmin, rejectProduct);

router.get('/seller/:sellerId', getProductsBySeller);

export default router;