import express from 'express';
import { createBrand, getAllBrands, getBrandById, updateBrand, deleteBrand } from '../controllers/brandController.js';
import { uploadImageEither, handleUploadError, validateImageFile } from '../../categoryManagement/middleware/upload.js';

const router = express.Router();

// Create brand (accepts 'image' or 'document')
router.post('/', uploadImageEither, handleUploadError, validateImageFile, createBrand);

// Get all brands
router.get('/', getAllBrands);

// Get brand by id
router.get('/:id', getBrandById);

// Update brand (optionally replace; accepts 'image' or 'document')
router.put('/:id', uploadImageEither, handleUploadError, validateImageFile, updateBrand);

// Delete brand
router.delete('/:id', deleteBrand);

export default router;


