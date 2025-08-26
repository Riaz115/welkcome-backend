import express from 'express';
import {
  registerSeller,
  loginSeller,
  getSellerProfile,
  updateSellerProfile,
  uploadDocuments,
  updateVerificationStatus,
  getVerificationStatus
} from '../controllers/sellerController.js';
import {
  verifyToken,
  requireAdmin,
  checkResourceAccess
} from '../middleware/auth.js';
import {
  uploadSellerDocs,
  uploadSingleDoc,
  handleUploadError,
  validateRequiredFiles
} from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', uploadSellerDocs, handleUploadError, validateRequiredFiles, registerSeller);
router.post('/login', loginSeller);
router.get('/status/:id', getVerificationStatus);

// Protected routes - require authentication
router.use(verifyToken);

// Seller profile routes - protected by resource access check
router.get('/profile/:id', checkResourceAccess, getSellerProfile);
router.put('/profile/:id', checkResourceAccess, updateSellerProfile);

// Document upload route - sellers can only upload to their own account
router.post('/upload-docs', uploadSingleDoc, handleUploadError, uploadDocuments);

// Admin only routes
router.patch('/status', requireAdmin, updateVerificationStatus);

export default router; 