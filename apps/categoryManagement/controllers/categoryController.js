import mongoose from 'mongoose';
import Category from '../models/Category.js';
import PrimeCategory from '../models/PrimeCategory.js';
import Subcategory from '../models/Subcategory.js';
import { generateUniqueSerialNumber, isSerialNumberUnique } from '../utils/serialGenerator.js';
import { getImageUrl, deleteFileFromS3 } from '../middleware/upload.js';

export const getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      primeCategoryId = '',
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

    if (primeCategoryId) {
      queryConditions.primeCategoryId = new mongoose.Types.ObjectId(primeCategoryId);
    }

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const pipeline = [
      { $match: queryConditions },
      {
        $lookup: {
          from: 'primecategories',
          localField: 'primeCategoryId',
          foreignField: '_id',
          as: 'primeCategory'
        }
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'subcategories'
        }
      },
      {
        $addFields: {
          categoryCount: { $size: '$subcategories' },
          totalProducts: { 
            $sum: '$subcategories.productCount'
          },
          primeCategory: { $arrayElemAt: ['$primeCategory', 0] },
          image: {
            $cond: {
              if: { $ne: ['$image', null] },
              then: '$image',
              else: null
            }
          }
        }
      },
      {
        $project: {
          subcategories: 0,
          'primeCategory.createdAt': 0,
          'primeCategory.updatedAt': 0,
          'primeCategory.image': 0,
          'primeCategory.status': 0
        }
      },
      { $sort: sortOptions },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) }
    ];

    const categories = await Category.aggregate(pipeline);
    const total = await Category.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: categories,
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
      message: 'Server error while fetching categories',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const getCategoriesByPrimeCategory = async (req, res) => {
  try {
    const { primeId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const queryConditions = { 
      primeCategoryId: new mongoose.Types.ObjectId(primeId) 
    };
    
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
          from: 'primecategories',
          localField: 'primeCategoryId',
          foreignField: '_id',
          as: 'primeCategory'
        }
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'subcategories'
        }
      },
      {
        $addFields: {
          categoryCount: { $size: '$subcategories' },
          totalProducts: { 
            $sum: '$subcategories.productCount'
          },
          primeCategory: { $arrayElemAt: ['$primeCategory', 0] },
          image: {
            $cond: {
              if: { $ne: ['$image', null] },
              then: '$image',
              else: null
            }
          }
        }
      },
      {
        $project: {
          subcategories: 0,
          'primeCategory.createdAt': 0,
          'primeCategory.updatedAt': 0,
          'primeCategory.image': 0,
          'primeCategory.status': 0
        }
      },
      { $sort: sortOptions },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) }
    ];

    const categories = await Category.aggregate(pipeline);
    const total = await Category.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: categories,
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
      message: 'Server error while fetching categories',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { include = '' } = req.query;

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'primecategories',
          localField: 'primeCategoryId',
          foreignField: '_id',
          as: 'primeCategory'
        }
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'subcategories'
        }
      },
      {
        $addFields: {
          categoryCount: { $size: '$subcategories' },
          totalProducts: { 
            $sum: '$subcategories.productCount'
          },
          primeCategory: { $arrayElemAt: ['$primeCategory', 0] },
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

    if (!include.includes('subcategories')) {
      pipeline.push({
        $project: {
          subcategories: 0,
          'primeCategory.createdAt': 0,
          'primeCategory.updatedAt': 0,
          'primeCategory.image': 0,
          'primeCategory.status': 0
        }
      });
    } else {
      pipeline.push({
        $project: {
          'primeCategory.createdAt': 0,
          'primeCategory.updatedAt': 0,
          'primeCategory.image': 0,
          'primeCategory.status': 0
        }
      });
    }

    const result = await Category.aggregate(pipeline);
    const category = result[0];

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, primeCategoryId, serialNumber, status = 'Active' } = req.body;

    const primeCategory = await PrimeCategory.findById(primeCategoryId);
    if (!primeCategory) {
      if (req.file?.key) {
        await deleteFileFromS3(req.file.key);
      }
      return res.status(404).json({
        success: false,
        message: 'Prime category not found',
        error: 'NOT_FOUND',
      });
    }

    const existingName = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      primeCategoryId,
    });

    if (existingName) {
      if (req.file?.key) {
        await deleteFileFromS3(req.file.key);
      }
      return res.status(400).json({
        success: false,
        message: 'Category name already exists in this prime category',
        error: 'DUPLICATE_ENTRY',
      });
    }

    let finalSerialNumber = serialNumber;
    if (!finalSerialNumber) {
      finalSerialNumber = await generateUniqueSerialNumber();
    } else {
      const isUnique = await isSerialNumberUnique(finalSerialNumber, null, 'category');
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

    const imageUrl = req.file?.location || (req.file?.key ? getImageUrl(req.file.key) : null);

    const category = new Category({
      name,
      primeCategoryId,
      serialNumber: finalSerialNumber,
      image: imageUrl,
      status,
    });

    await category.save();

    const responseData = {
      id: category._id,
      name: category.name,
      serialNumber: category.serialNumber,
      image: imageUrl,
      status: category.status,
      primeCategoryId: category.primeCategoryId,
      categoryCount: 0,
      totalProducts: 0,
      primeCategory: {
        _id: primeCategory._id,
        name: primeCategory.name,
      },
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
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
      message: 'Server error while creating category',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      if (req.file?.key) {
        await deleteFileFromS3(req.file.key);
      }
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'NOT_FOUND',
      });
    }

    const updateData = {};

    if (name && name !== category.name) {
      const existingName = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        primeCategoryId: category.primeCategoryId,
        _id: { $ne: id },
      });

      if (existingName) {
        if (req.file?.key) {
          await deleteFileFromS3(req.file.key);
        }
        return res.status(400).json({
          success: false,
          message: 'Category name already exists in this prime category',
          error: 'DUPLICATE_ENTRY',
        });
      }

      updateData.name = name;
    }

    if (status) {
      updateData.status = status;
    }

    if (req.file?.location) {
      if (category.image) {
        const oldKey = category.image.includes('.amazonaws.com/')
          ? category.image.split('.amazonaws.com/')[1]
          : category.image;
        if (oldKey) {
          await deleteFileFromS3(oldKey);
        }
      }
      updateData.image = req.file.location;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(updatedCategory._id) } },
      {
        $lookup: {
          from: 'primecategories',
          localField: 'primeCategoryId',
          foreignField: '_id',
          as: 'primeCategory',
        },
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'subcategories',
        },
      },
      {
        $addFields: {
          categoryCount: { $size: '$subcategories' },
          totalProducts: {
            $sum: '$subcategories.productCount',
          },
          primeCategory: { $arrayElemAt: ['$primeCategory', 0] },
          image: {
            $cond: [
              { $ne: ['$image', null] },
              {
                $cond: [
                  { $eq: [ { $indexOfBytes: ['$image', 'http'] }, 0 ] },
                  '$image',
                  {
                    $concat: [
                      process.env.AWS_S3_PUBLIC_URL || 'http://localhost:3000',
                      '/',
                      '$image'
                    ]
                  }
                ]
              },
              null
            ]
          },
        },
      },
      {
        $project: {
          subcategories: 0,
          'primeCategory.createdAt': 0,
          'primeCategory.updatedAt': 0,
          'primeCategory.image': 0,
          'primeCategory.status': 0,
        },
      },
    ];

    const result = await Category.aggregate(pipeline);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: result[0],
    });
  } catch (error) {
    if (req.file?.key) {
      await deleteFileFromS3(req.file.key);
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating category',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'NOT_FOUND'
      });
    }

    const subcategoryCount = await Subcategory.countDocuments({ categoryId: id });
    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${subcategoryCount} existing subcategories`,
        error: 'CATEGORY_HAS_SUBCATEGORIES',
        details: { subcategoryCount }
      });
    }

    if (category.image) {
      await deleteFileFromS3(category.image);
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};