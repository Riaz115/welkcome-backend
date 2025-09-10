import express from 'express';
import {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  getActiveBanners,
  toggleBannerStatus,
  incrementBannerClick
} from '../controllers/bannerController.js';
import { auth } from '../../auth/middleware/auth.js';
import { uploadBannerImage, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.get('/active', getActiveBanners);
router.post('/:id/click', incrementBannerClick);

router.use(auth);

router.post('/', uploadBannerImage, handleUploadError, createBanner);
router.get('/', getAllBanners);
router.get('/:id', getBannerById);
router.patch('/:id', uploadBannerImage, handleUploadError, updateBanner);
router.delete('/:id', deleteBanner);
router.patch('/:id/toggle', toggleBannerStatus);

export default router;
