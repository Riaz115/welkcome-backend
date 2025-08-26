import { generateSerialNumber } from '../utils/serialGenerator.js';
import PrimeCategory from '../models/PrimeCategory.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';

// @desc    Generate new serial number
// @route   GET /api/categories/utils/generate-serial
// @access  Public
export const generateNewSerialNumber = async (req, res) => {
  try {
    const serialNumber = generateSerialNumber();
    
    res.status(200).json({
      success: true,
      data: {
        serialNumber
      }
    });
  } catch (error) {
    console.error('Error generating serial number:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating serial number',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// @desc    Get category statistics
// @route   GET /api/categories/utils/statistics
// @access  Public
export const getCategoryStatistics = async (req, res) => {
  try {
    // Get counts for each category type
    const [
      totalPrimeCategories,
      totalCategories,
      totalSubcategories,
      activePrimeCategories,
      activeCategories,
      activeSubcategories,
      inStockSubcategories,
      outOfStockSubcategories
    ] = await Promise.all([
      PrimeCategory.countDocuments(),
      Category.countDocuments(),
      Subcategory.countDocuments(),
      PrimeCategory.countDocuments({ status: 'Active' }),
      Category.countDocuments({ status: 'Active' }),
      Subcategory.countDocuments({ status: 'Active' }),
      Subcategory.countDocuments({ stockStatus: 'In Stock' }),
      Subcategory.countDocuments({ stockStatus: 'Out of Stock' })
    ]);

    // Get total products count
    const totalProductsResult = await Subcategory.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: '$productCount' }
        }
      }
    ]);
    
    const totalProducts = totalProductsResult.length > 0 ? totalProductsResult[0].totalProducts : 0;

    // Get inactive counts
    const inactivePrimeCategories = totalPrimeCategories - activePrimeCategories;
    const inactiveCategories = totalCategories - activeCategories;
    const inactiveSubcategories = totalSubcategories - activeSubcategories;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      recentPrimeCategories,
      recentCategories,
      recentSubcategories
    ] = await Promise.all([
      PrimeCategory.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Category.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Subcategory.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // Get top categories by product count
    const topCategories = await Category.aggregate([
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
          totalProducts: { $sum: '$subcategories.productCount' }
        }
      },
      {
        $sort: { totalProducts: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          name: 1,
          totalProducts: 1,
          subcategories: { $size: '$subcategories' }
        }
      }
    ]);

    const statistics = {
      overview: {
        totalPrimeCategories,
        totalCategories,
        totalSubcategories,
        totalProducts
      },
      status: {
        active: {
          primeCategories: activePrimeCategories,
          categories: activeCategories,
          subcategories: activeSubcategories
        },
        inactive: {
          primeCategories: inactivePrimeCategories,
          categories: inactiveCategories,
          subcategories: inactiveSubcategories
        }
      },
      stock: {
        inStock: inStockSubcategories,
        outOfStock: outOfStockSubcategories
      },
      recentActivity: {
        primeCategories: recentPrimeCategories,
        categories: recentCategories,
        subcategories: recentSubcategories,
        period: '30 days'
      },
      topCategories
    };

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// @desc    Get category hierarchy
// @route   GET /api/categories/utils/hierarchy
// @access  Public
export const getCategoryHierarchy = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    const statusFilter = includeInactive === 'true' ? {} : { status: 'Active' };

    const hierarchy = await PrimeCategory.aggregate([
      { $match: statusFilter },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'primeCategoryId',
          as: 'categories',
          pipeline: [
            { $match: statusFilter },
            {
              $lookup: {
                from: 'subcategories',
                localField: '_id',
                foreignField: 'categoryId',
                as: 'subcategories',
                pipeline: [
                  { $match: statusFilter },
                  {
                    $project: {
                      name: 1,
                      serialNumber: 1,
                      status: 1,
                      productCount: 1,
                      stockStatus: 1
                    }
                  }
                ]
              }
            },
            {
              $project: {
                name: 1,
                serialNumber: 1,
                status: 1,
                subcategoryCount: { $size: '$subcategories' },
                totalProducts: { $sum: '$subcategories.productCount' },
                subcategories: 1
              }
            }
          ]
        }
      },
      {
        $project: {
          name: 1,
          serialNumber: 1,
          status: 1,
          categoryCount: { $size: '$categories' },
          totalProducts: {
            $sum: {
              $map: {
                input: '$categories',
                as: 'category',
                in: '$$category.totalProducts'
              }
            }
          },
          categories: 1
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    console.error('Error fetching category hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hierarchy',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// @desc    Bulk update status
// @route   PATCH /api/categories/utils/bulk-status
// @access  Admin
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { type, ids, status } = req.body; // type: 'prime', 'category', 'subcategory'
    
    if (!['prime', 'category', 'subcategory'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be prime, category, or subcategory',
        error: 'INVALID_TYPE'
      });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs array is required and cannot be empty',
        error: 'INVALID_IDS'
      });
    }

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Active or Inactive',
        error: 'INVALID_STATUS'
      });
    }

    let Model;
    switch (type) {
      case 'prime':
        Model = PrimeCategory;
        break;
      case 'category':
        Model = Category;
        break;
      case 'subcategory':
        Model = Subcategory;
        break;
    }

    const result = await Model.updateMany(
      { _id: { $in: ids } },
      { status },
      { runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} ${type}(s) updated successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error in bulk status update:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// @desc    Export categories data
// @route   GET /api/categories/utils/export
// @access  Admin
export const exportCategoriesData = async (req, res) => {
  try {
    const { format = 'json', type = 'all' } = req.query;
    
    let data = {};

    if (type === 'all' || type === 'prime') {
      data.primeCategories = await PrimeCategory.find({})
        .select('-__v')
        .sort({ name: 1 });
    }

    if (type === 'all' || type === 'category') {
      data.categories = await Category.find({})
        .populate('primeCategoryId', 'name')
        .select('-__v')
        .sort({ name: 1 });
    }

    if (type === 'all' || type === 'subcategory') {
      data.subcategories = await Subcategory.find({})
        .populate({
          path: 'categoryId',
          select: 'name',
          populate: {
            path: 'primeCategoryId',
            select: 'name'
          }
        })
        .select('-__v')
        .sort({ name: 1 });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=categories-export.json');
      res.status(200).json({
        success: true,
        exportedAt: new Date().toISOString(),
        data
      });
    } else {
      // For future: CSV export could be implemented here
      return res.status(400).json({
        success: false,
        message: 'Only JSON format is currently supported',
        error: 'UNSUPPORTED_FORMAT'
      });
    }
  } catch (error) {
    console.error('Error exporting categories data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting data',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}; 