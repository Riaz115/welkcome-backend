import mongoose from 'mongoose';
import Subcategory from '../models/Subcategory.js';
import Category from '../models/Category.js';
import { generateUniqueSerialNumber, isSerialNumberUnique } from '../utils/serialGenerator.js';
import { getImageUrl, deleteFileFromS3 } from '../middleware/upload.js';

export const getAllSubcategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      stockStatus = '',
      categoryId = '',
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

    if (stockStatus) {
      queryConditions.stockStatus = stockStatus;
    }

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      queryConditions.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const pipeline = [
      { $match: queryConditions },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $lookup: {
          from: 'primecategories',
          localField: 'category.primeCategoryId',
          foreignField: '_id',
          as: 'primeCategory'
        }
      },
      { $unwind: '$primeCategory' },
      {
        $addFields: {
          category: {
            _id: '$category._id',
            name: '$category.name',
            serialNumber: '$category.serialNumber',
            primeCategory: {
              _id: '$primeCategory._id',
              name: '$primeCategory.name',
              serialNumber: '$primeCategory.serialNumber'
            }
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
      {
        $project: {
          primeCategory: 0,
          'category.createdAt': 0,
          'category.updatedAt': 0,
          'category.image': 0,
          'category.status': 0
        }
      },
      { $sort: sortOptions },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) }
    ];

    const subcategories = await Subcategory.aggregate(pipeline);
    const total = await Subcategory.countDocuments(queryConditions);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: subcategories,
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
      message: 'Server error while fetching subcategories',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const getSubcategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
        error: 'INVALID_ID'
      });
    }

    const modifiedReq = {
      ...req,
      query: {
        ...req.query,
        categoryId: categoryId
      }
    };

    return getAllSubcategories(modifiedReq, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subcategories',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const getSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $lookup: {
          from: 'primecategories',
          localField: 'category.primeCategoryId',
          foreignField: '_id',
          as: 'primeCategory'
        }
      },
      {
        $addFields: {
          category: { 
            $mergeObjects: [
              { $arrayElemAt: ['$category', 0] },
              { primeCategory: { $arrayElemAt: ['$primeCategory', 0] } }
            ]
          },
          image: {
            $cond: {
              if: { $ne: ['$image', null] },
              then: { $concat: [process.env.BASE_URL || 'http://localhost:3000', '/uploads/categories/', '$image'] },
              else: null
            }
          }
        }
      },
      {
        $project: {
          primeCategory: 0,
          'category.createdAt': 0,
          'category.updatedAt': 0,
          'category.image': 0,
          'category.status': 0,
          'category.primeCategoryId': 0,
          'category.primeCategory.createdAt': 0,
          'category.primeCategory.updatedAt': 0,
          'category.primeCategory.image': 0,
          'category.primeCategory.status': 0
        }
      }
    ];

    const result = await Subcategory.aggregate(pipeline);
    const subcategory = result[0];

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: subcategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subcategory',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const createSubcategory = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      serialNumber,
      productCount = 0,
      stockStatus = 'In Stock',
      status = 'Active'
    } = req.body;

    const category = await Category.findById(categoryId).populate('primeCategoryId');
    if (!category) {
      if (req.file?.key) await deleteFileFromS3(req.file.key);
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: 'NOT_FOUND'
      });
    }

    const existingName = await Subcategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      categoryId
    });

    if (existingName) {
      if (req.file?.key) await deleteFileFromS3(req.file.key);
      return res.status(400).json({
        success: false,
        message: 'Subcategory name already exists in this category',
        error: 'DUPLICATE_ENTRY'
      });
    }

    let finalSerialNumber = serialNumber;
    if (!finalSerialNumber) {
      finalSerialNumber = await generateUniqueSerialNumber();
    } else {
      const isUnique = await isSerialNumberUnique(finalSerialNumber, null, 'subcategory');
      if (!isUnique) {
        if (req.file?.key) await deleteFileFromS3(req.file.key);
        return res.status(400).json({
          success: false,
          message: 'Serial number already exists',
          error: 'DUPLICATE_ENTRY'
        });
      }
    }

    const imageUrl = req.file?.location || null;

    const finalStockStatus = parseInt(productCount) > 0 ? stockStatus : 'Out of Stock';

    const subcategory = new Subcategory({
      name,
      categoryId,
      serialNumber: finalSerialNumber,
      image: imageUrl,
      productCount: parseInt(productCount),
      stockStatus: finalStockStatus,
      status
    });

    await subcategory.save();

    const responseData = {
      id: subcategory._id,
      name: subcategory.name,
      serialNumber: subcategory.serialNumber,
      image: imageUrl,
      status: subcategory.status,
      categoryId: subcategory.categoryId,
      productCount: subcategory.productCount,
      stockStatus: subcategory.stockStatus,
      category: {
        _id: category._id,
        name: category.name,
        primeCategory: {
          _id: category.primeCategoryId._id,
          name: category.primeCategoryId.name
        }
      },
      createdAt: subcategory.createdAt,
      updatedAt: subcategory.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: responseData
    });
  } catch (error) {
    if (req.file?.key) {
      await deleteFileFromS3(req.file.key);
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating subcategory',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, productCount, stockStatus, status } = req.body;

    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      if (req.file?.key) await deleteFileFromS3(req.file.key);
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found',
        error: 'NOT_FOUND'
      });
    }

    const updateData = {};

    if (name && name !== subcategory.name) {
      const existingName = await Subcategory.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        categoryId: subcategory.categoryId,
        _id: { $ne: id }
      });

      if (existingName) {
        if (req.file?.key) await deleteFileFromS3(req.file.key);
        return res.status(400).json({
          success: false,
          message: 'Subcategory name already exists in this category',
          error: 'DUPLICATE_ENTRY'
        });
      }

      updateData.name = name;
    }

    if (productCount !== undefined) {
      const parsedCount = parseInt(productCount);
      updateData.productCount = parsedCount;
      updateData.stockStatus = parsedCount > 0 ? (stockStatus || 'In Stock') : 'Out of Stock';
    } else if (stockStatus) {
      updateData.stockStatus = stockStatus;
    }

    if (status) {
      updateData.status = status;
    }

    if (req.file?.location) {
      if (subcategory.image) {
        const oldKey = subcategory.image.includes('/') ? subcategory.image.split('/').pop() : subcategory.image;
        await deleteFileFromS3(oldKey);
      }
      updateData.image = req.file.location;
    }

    await Subcategory.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $lookup: {
          from: 'primecategories',
          localField: 'category.primeCategoryId',
          foreignField: '_id',
          as: 'category.primeCategory'
        }
      },
      {
        $unwind: {
          path: '$category.primeCategory',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
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
          'category.createdAt': 0,
          'category.updatedAt': 0,
          'category.image': 0,
          'category.status': 0,
          'category.primeCategoryId': 0,
          'category.primeCategory.createdAt': 0,
          'category.primeCategory.updatedAt': 0,
          'category.primeCategory.image': 0,
          'category.primeCategory.status': 0
        }
      }
    ];

    const result = await Subcategory.aggregate(pipeline);

    res.status(200).json({
      success: true,
      message: 'Subcategory updated successfully',
      data: result[0]
    });

  } catch (error) {
    if (req.file?.key) {
      await deleteFileFromS3(req.file.key);
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating subcategory',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found',
        error: 'NOT_FOUND'
      });
    }

    if (subcategory.image) {
      await deleteFileFromS3(subcategory.image);
    }

    await Subcategory.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting subcategory',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

export const updateProductCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { productCount, operation = 'set' } = req.body;

    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found',
        error: 'NOT_FOUND'
      });
    }

    const parsedCount = parseInt(productCount);
    if (isNaN(parsedCount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product count',
        error: 'INVALID_INPUT'
      });
    }

    let newProductCount;
    switch (operation) {
      case 'increment':
        newProductCount = subcategory.productCount + parsedCount;
        break;
      case 'decrement':
        newProductCount = Math.max(0, subcategory.productCount - parsedCount);
        break;
      case 'set':
      default:
        newProductCount = parsedCount;
        break;
    }

    const updateData = {
      productCount: newProductCount,
      stockStatus: newProductCount > 0 ? 'In Stock' : 'Out of Stock'
    };

    const updatedSubcategory = await Subcategory.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Product count updated successfully',
      data: {
        id: updatedSubcategory._id,
        productCount: updatedSubcategory.productCount,
        stockStatus: updatedSubcategory.stockStatus,
        updatedAt: updatedSubcategory.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating product count',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};