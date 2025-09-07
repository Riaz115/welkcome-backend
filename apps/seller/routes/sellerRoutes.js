import express from 'express';
import {
  becomeSeller,
  getAllSellers,
  getSellerById,
  getMySellerProfile,
  updateSeller,
  deleteSeller,
  verifySeller,
  getSellerStats,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  clearAllSellers,
  testSellerCreation,
  blockSeller,
  unblockSeller
} from '../controllers/sellerController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { uploadSellerDocs, handleUploadError, validateRequiredFiles } from '../middleware/upload.js';
import { parseFormData, validateBecomeSeller, validateUpdateSeller, validateVerifySeller } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/stats', getSellerStats);
router.get('/test', testSellerCreation);
router.get('/:id', getSellerById);
router.post('/become-seller', uploadSellerDocs, parseFormData, validateRequiredFiles, validateBecomeSeller, handleUploadError, becomeSeller);

// Protected routes - require authentication
router.use(verifyToken);

// User routes
router.get('/profile/me', getMySellerProfile);
router.put('/profile/me', uploadSellerDocs, parseFormData, validateUpdateSeller, handleUploadError, updateSeller);
router.delete('/profile/me', deleteSeller);

// Admin routes
router.get('/', requireAdmin, getAllSellers);
router.get('/pending', requireAdmin, getPendingSellers);
router.delete('/clear-all', requireAdmin, clearAllSellers);
router.patch('/:sellerId/approve', requireAdmin, approveSeller);
router.patch('/:sellerId/reject', requireAdmin, rejectSeller);
router.patch('/:sellerId/block', requireAdmin, blockSeller);
router.patch('/:sellerId/unblock', requireAdmin, unblockSeller);
router.put('/:id', requireAdmin, uploadSellerDocs, parseFormData, validateUpdateSeller, handleUploadError, updateSeller);
router.delete('/:id', requireAdmin, deleteSeller);
router.patch('/:id/verify', requireAdmin, validateVerifySeller, verifySeller);

export default router; 