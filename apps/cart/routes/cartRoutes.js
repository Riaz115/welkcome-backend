import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} from '../controllers/cartController.js';
import { auth } from '../../auth/middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Cart routes
router.get('/', getCart); // Get user's cart
router.post('/add', addToCart); // Add item to cart
router.patch('/update', updateCartItem); // Update item quantity
router.delete('/remove', removeFromCart); // Remove item from cart
router.delete('/clear', clearCart); // Clear entire cart

// Coupon routes for cart
router.post('/apply-coupon', applyCoupon); // Apply coupon to cart
router.delete('/remove-coupon', removeCoupon); // Remove coupon from cart

export default router;
