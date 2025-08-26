import mongoose from 'mongoose';
import Brand from '../models/Brand.js';
import { deleteFileFromS3 } from '../../categoryManagement/middleware/upload.js';

export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const uploaded = req.file || (req.files && (req.files.image?.[0] || req.files.document?.[0]));
    if (!uploaded) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const brand = new Brand({
      name: name.trim(),
      image: uploaded.location || uploaded.key
    });

    const saved = await brand.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Brand with this name already exists' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: brands });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    return res.status(200).json({ success: true, data: brand });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    if (req.body.name) {
      brand.name = req.body.name.trim();
    }

    const uploaded = req.file || (req.files && (req.files.image?.[0] || req.files.document?.[0]));
    if (uploaded?.location) {
      if (brand.image) {
        const oldKey = brand.image.split('/').pop();
        await deleteFileFromS3(oldKey);
      }
      brand.image = uploaded.location;
    }

    const saved = await brand.save();
    return res.status(200).json({ success: true, data: saved });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Brand with this name already exists' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    if (brand.image) {
      const oldKey = brand.image.split('/').pop();
      await deleteFileFromS3(oldKey);
    }

    return res.status(200).json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


