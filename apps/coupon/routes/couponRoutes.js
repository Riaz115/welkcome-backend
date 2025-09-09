import express from 'express';
import {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon, 
  deleteCoupon,
  validateCoupon,
  getAvailableCoupons,
  toggleCouponStatus
} from '../controllers/couponController.js';
import { auth } from '../../auth/middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/available', getAvailableCoupons); // Get available coupons for user
router.post('/validate', validateCoupon); // Validate coupon code

// Protected routes (authentication required)
router.use(auth);

// Admin routes (you might want to add admin role check)
router.post('/', createCoupon); // Create new coupon
router.get('/', getAllCoupons); // Get all coupons
router.get('/:id', getCouponById); // Get coupon by ID
router.patch('/:id', updateCoupon); // Update coupon
router.delete('/:id', deleteCoupon); // Delete coupon
router.patch('/:id/toggle', toggleCouponStatus); // Toggle coupon status

export default router;
