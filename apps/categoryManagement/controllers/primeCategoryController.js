import mongoose from 'mongoose';
import PrimeCategory from '../models/PrimeCategory.js';
import Category from '../models/Category.js';
import { generateUniqueSerialNumber, isSerialNumberUnique, validateSerialNumber } from '../utils/serialGenerator.js';
import { deleteFileFromS3 } from '../middleware/upload.js';

export const getAllPrimeCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const queryConditions = {};
    
    if (search) {
      queryConditions.name = { $regex: search, $options: 'i' };
    }
    
    if (status) {
      queryConditions.status = status;
    }

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const pipeline = [
      { $match: queryConditions },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'primeCategoryId',
          as: 'categories'
        }
      },
      {
        $lookup: {
          from: 'subcategories',
          let: { categoryIds: '$categories._id' },
          pipeline: [
            { $match: { $expr: { $in: ['$categoryId', '$$categoryIds'] } } },
            { $group: { _id: null, totalProducts: { $sum: '$productCount' } } }
          ],
          as: 'productStats'
        }
      },
      {
        $addFields: {
          categoryCount: { $size: '$categories' },
          totalProducts: { 
            $ifNull: [{ $arrayElemAt: ['$productStats.totalProducts', 0] }, 0] 
          },
          image: {
            $cond: {
              if: { $ne: ['$image', null] },
              then: '$image',
              else: null
            }
          }
        }
      },
      { $sort: sortOptions },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) },
      {
        $project: {
          categories: 0,
          productStats: 0
        }
      }
    ];

    const primeCategories = await PrimeCategory.aggregate(pipeline);
    const total = await PrimeCategory.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: primeCategories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prime categories',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const getPrimeCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { include = '' } = req.query;

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'primeCategoryId',
          as: 'categories'
        }
      },
      {
        $lookup: {
          from: 'subcategories',
          let: { categoryIds: '$categories._id' },
          pipeline: [
            { $match: { $expr: { $in: ['$categoryId', '$$categoryIds'] } } },
            { $group: { _id: null, totalProducts: { $sum: '$productCount' } } }
          ],
          as: 'productStats'
        }
      },
      {
        $addFields: {
          categoryCount: { $size: '$categories' },
          totalProducts: { 
            $ifNull: [{ $arrayElemAt: ['$productStats.totalProducts', 0] }, 0] 
          },
          image: {
            $cond: {
              if: { $ne: ['$image', null] },
              then: '$image',
              else: null
            }
          }
        }
      }
    ];

    if (!include.includes('categories')) {
      pipeline.push({
        $project: {
          categories: 0,
          productStats: 0
        }
      });
    } else {
      pipeline.push({
        $project: {
          productStats: 0
        }
      });
    }

    const result = await PrimeCategory.aggregate(pipeline);
    const primeCategory = result[0];

    if (!primeCategory) {
      return res.status(404).json({
        success: false,
        message: 'Prime category not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: primeCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prime category',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const createPrimeCategory = async (req, res) => {
  try {
    const { name, status = 'Active' } = req.body;
    let { serialNumber } = req.body;

    const normalize = (value) => {
      if (value === undefined || value === null) return undefined;
      if (Array.isArray(value)) return normalize(value[0]);
      if (typeof value === 'object') return undefined;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
          return undefined;
        }
        return trimmed.toUpperCase();
      }
      return String(value).toUpperCase();
    };

    const normalized = normalize(serialNumber);

    const existingName = await PrimeCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingName) {
      if (req.file?.key) {
        await deleteFileFromS3(req.file.key);
      }
      return res.status(400).json({
        success: false,
        message: 'Prime category name already exists',
        error: 'DUPLICATE_ENTRY',
      });
    }

    let finalSerialNumber = normalized;
    if (finalSerialNumber === undefined) {
      finalSerialNumber = await generateUniqueSerialNumber();
    } else {
      if (!validateSerialNumber(finalSerialNumber)) {
        if (req.file?.key) {
          await deleteFileFromS3(req.file.key);
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid serial number format. Use 2-3 letters + 4-6 digits (e.g., AB1234).',
          error: 'VALIDATION_ERROR',
        });
      }

      const isUnique = await isSerialNumberUnique(finalSerialNumber, null, 'prime');
      if (!isUnique) {
        if (req.file?.key) {
          await deleteFileFromS3(req.file.key);
        }
        return res.status(400).json({
          success: false,
          message: 'Serial number already exists',
          error: 'DUPLICATE_ENTRY',
        });
      }
    }

    const imageUrl = req.file?.location || null;

    const primeCategory = new PrimeCategory({
      name,
      serialNumber: finalSerialNumber,
      image: imageUrl,
      status,
    });

    await primeCategory.save();

    const responseData = {
      id: primeCategory._id,
      name: primeCategory.name,
      serialNumber: primeCategory.serialNumber,
      image: imageUrl,
      status: primeCategory.status,
      categoryCount: 0,
      totalProducts: 0,
      createdAt: primeCategory.createdAt,
      updatedAt: primeCategory.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: 'Prime category created successfully',
      data: responseData,
    });
  } catch (error) {
    if (req.file?.key) {
      await deleteFileFromS3(req.file.key);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        details: errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating prime category',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
};

export const updatePrimeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const primeCategory = await PrimeCategory.findById(id);
    if (!primeCategory) {
      if (req.file?.key) {
        await deleteFileFromS3(req.file.key);
      }
      return res.status(404).json({
        success: false,
        message: 'Prime category not found',
        error: 'NOT_FOUND'
      });
    }

    const updateData = {};

    if (name && name.toLowerCase() !== primeCategory.name.toLowerCase()) {
      const existingName = await PrimeCategory.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingName) {
        if (req.file?.key) {
          await deleteFileFromS3(req.file.key);
        }
        return res.status(400).json({
          success: false,
          message: 'Prime category name already exists',
          error: 'DUPLICATE_ENTRY'
        });
      }

      updateData.name = name;
    }

    if (status) {
      updateData.status = status;
    }

    if (req.file?.location) {
      if (primeCategory.image) {
        const oldKey = primeCategory.image.split('/').pop();
        await deleteFileFromS3(oldKey);
      }
      updateData.image = req.file.location;
    }

    const updatedCategory = await PrimeCategory.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    const pipeline = [
      { $match: { _id: updatedCategory._id } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'primeCategoryId',
          as: 'categories'
        }
      },
      {
        $lookup: {
          from: 'subcategories',
          let: { categoryIds: '$categories._id' },
          pipeline: [
            { $match: { $expr: { $in: ['$categoryId', '$$categoryIds'] } } },
            { $group: { _id: null, totalProducts: { $sum: '$productCount' } } }
          ],
          as: 'productStats'
        }
      },
      {
        $addFields: {
          categoryCount: { $size: '$categories' },
          totalProducts: {
            $ifNull: [{ $arrayElemAt: ['$productStats.totalProducts', 0] }, 0]
          }
        }
      },
      {
        $project: {
          categories: 0,
          productStats: 0
        }
      }
    ];

    const result = await PrimeCategory.aggregate(pipeline);

    res.status(200).json({
      success: true,
      message: 'Prime category updated successfully',
      data: result[0]
    });
  } catch (error) {
    if (req.file?.key) {
      await deleteFileFromS3(req.file.key);
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating prime category',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const deletePrimeCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const primeCategory = await PrimeCategory.findById(id);
    if (!primeCategory) {
      return res.status(404).json({
        success: false,
        message: 'Prime category not found',
        error: 'NOT_FOUND'
      });
    }

    const categoryCount = await Category.countDocuments({ primeCategoryId: id });
    if (categoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete prime category with ${categoryCount} existing categories`,
        error: 'PRIME_CATEGORY_HAS_CATEGORIES',
        details: { categoryCount }
      });
    }

    if (primeCategory.image) {
      const key = primeCategory.image.split('/').pop();
      await deleteFileFromS3(key);
    }

    await PrimeCategory.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Prime category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting prime category',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};