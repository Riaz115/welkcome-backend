import express from 'express';
import {
  registerRider,
  loginRider,
  getRiderProfile,
  updateRiderProfile,
  uploadDocuments,
  updateVerificationStatus,
  getVerificationStatus,
  updateAvailability
} from '../controllers/riderController.js';
import {
  verifyToken,
  requireAdmin,
  checkResourceAccess,
  requireVerified
} from '../middleware/auth.js';
import {
  uploadRiderDocs,
  uploadSingleDoc,
  handleUploadError,
  validateRequiredFiles
} from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', uploadRiderDocs, handleUploadError, validateRequiredFiles, registerRider);
router.post('/login', loginRider);
router.get('/status/:id', getVerificationStatus);

// Protected routes - require authentication
router.use(verifyToken);

// Rider profile routes - protected by resource access check
router.get('/profile/:id', checkResourceAccess, getRiderProfile);
router.put('/profile/:id', checkResourceAccess, updateRiderProfile);

// Document upload route - riders can only upload to their own account
router.post('/upload-docs', uploadSingleDoc, handleUploadError, uploadDocuments);

// Availability route - verified riders only
router.patch('/availability/:id', checkResourceAccess, updateAvailability);

// Admin only routes
router.patch('/status', requireAdmin, updateVerificationStatus);

export default router; 