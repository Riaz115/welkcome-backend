import express from 'express';
import {
  createFlashSale,
  getAllFlashSales,
  getFlashSaleById,
  updateFlashSale,
  deleteFlashSale,
  getActiveFlashSales,
  getUpcomingFlashSales,
  validateFlashSale,
  toggleFlashSaleStatus,
  incrementFlashSaleClick
} from '../controllers/flashsaleController.js';
import { auth } from '../../auth/middleware/auth.js';
import { uploadFlashSaleImage, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.get('/active', getActiveFlashSales);
router.get('/upcoming', getUpcomingFlashSales);
router.post('/validate', validateFlashSale);
router.post('/:id/click', incrementFlashSaleClick);

router.use(auth);

router.post('/', uploadFlashSaleImage, handleUploadError, createFlashSale);
router.get('/', getAllFlashSales);
router.get('/:id', getFlashSaleById);
router.patch('/:id', uploadFlashSaleImage, handleUploadError, updateFlashSale);
router.delete('/:id', deleteFlashSale);
router.patch('/:id/toggle', toggleFlashSaleStatus);

export default router;
