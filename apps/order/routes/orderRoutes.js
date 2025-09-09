import express from 'express';
import {
  createOrderFromCart,
  createDirectOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getAllOrders,
  getOrderStats
} from '../controllers/orderController.js';
import {
  initiatePayment,
  verifyPayment,
  getPaymentMethods,
  webhookPayment
} from '../controllers/paymentController.js';
import { auth, requireAdmin } from '../../auth/middleware/auth.js';

const router = express.Router();

router.use(auth);

router.post('/cart/checkout', createOrderFromCart);
router.post('/direct-buy', createDirectOrder);
router.get('/my-orders', getUserOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/status', updateOrderStatus);
router.patch('/:orderId/payment-status', updatePaymentStatus);
router.patch('/:orderId/cancel', cancelOrder);

router.post('/:orderId/payment/initiate', initiatePayment);
router.post('/:orderId/payment/verify', verifyPayment);
router.post('/payment/webhook', webhookPayment);
router.get('/payment/methods', getPaymentMethods);

router.get('/admin/all-orders',  getAllOrders);
router.get('/admin/stats',  getOrderStats);

export default router;
