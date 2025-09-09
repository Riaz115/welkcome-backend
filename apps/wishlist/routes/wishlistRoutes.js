import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlistStatus,
  moveToCart
} from '../controllers/wishlistController.js';
import { auth } from '../../auth/middleware/auth.js';

const router = express.Router();

router.use(auth);
 
router.get('/', getWishlist);
router.post('/add', addToWishlist);
router.delete('/remove', removeFromWishlist);
router.delete('/clear', clearWishlist);
router.get('/check', checkWishlistStatus);
router.post('/move-to-cart', moveToCart);

export default router;
