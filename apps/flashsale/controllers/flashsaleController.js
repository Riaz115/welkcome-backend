import FlashSale from '../models/flashsaleModel.js';
import { getS3ImageUrl } from '../middleware/upload.js';

export const createFlashSale = async (req, res) => {
  try {
    const {
      title,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startTime,
      endTime,
      applicablePrimeCategories,
      applicableCategories,
      applicableSubcategories,
      applicableProducts,
      excludedProducts,
      applicableBrands,
      usageLimit,
      userUsageLimit,
      flashSaleType,
      position
    } = req.body;

    const image = req.file ? req.file.location : req.body.image;

    if (!title || !image || !discountType || !discountValue || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, image, discountType, discountValue, startTime, endTime'
      });
    }

    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount cannot exceed 100%'
      });
    }

    if (discountType === 'fixed' && discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed discount must be greater than 0'
      });
    }

    const flashSale = new FlashSale({
      title,
      description,
      image,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      applicablePrimeCategories,
      applicableCategories,
      applicableSubcategories,
      applicableProducts,
      excludedProducts,
      applicableBrands,
      usageLimit,
      userUsageLimit: userUsageLimit || 1,
      flashSaleType: flashSaleType || 'special',
      position: position || 0,
      createdBy: req.user.id
    });

    await flashSale.save();

    res.status(201).json({
      success: true,
      message: 'Flash sale created successfully',
      data: { flashSale }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create flash sale',
      error: error.message
    });
  }
};

export const getAllFlashSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', flashSaleType } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    
    if (status === 'active') {
      const now = new Date();
      filter = {
        isActive: true,
        startTime: { $lte: now },
        endTime: { $gte: now }
      };
    } else if (status === 'upcoming') {
      filter = {
        isActive: true,
        startTime: { $gt: new Date() }
      };
    } else if (status === 'expired') {
      filter = {
        endTime: { $lt: new Date() }
      };
    } else if (status === 'inactive') {
      filter = {
        isActive: false
      };
    }

    if (flashSaleType) {
      filter.flashSaleType = flashSaleType;
    }

    const flashSales = await FlashSale.find(filter)
      .populate('createdBy', 'name email')
      .sort({ position: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FlashSale.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Flash sales retrieved successfully',
      data: {
        flashSales,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalFlashSales: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve flash sales',
      error: error.message
    });
  }
};

export const getFlashSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const flashSale = await FlashSale.findById(id)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'title brand')
      .populate('excludedProducts', 'title brand');

    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Flash sale not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Flash sale retrieved successfully',
      data: { flashSale }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve flash sale',
      error: error.message
    });
  }
};

export const updateFlashSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.file) {
      updateData.image = req.file.location;
    }

    delete updateData.createdBy;
    delete updateData.usedCount;
    delete updateData.lastUsedAt;

    const flashSale = await FlashSale.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Flash sale not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Flash sale updated successfully',
      data: { flashSale }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update flash sale',
      error: error.message
    });
  }
};

export const deleteFlashSale = async (req, res) => {
  try {
    const { id } = req.params;

    const flashSale = await FlashSale.findByIdAndDelete(id);
    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Flash sale not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Flash sale deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete flash sale',
      error: error.message
    });
  }
};

export const getActiveFlashSales = async (req, res) => {
  try {
    const { flashSaleType, orderAmount = 0 } = req.query;

    let flashSales;
    if (flashSaleType) {
      flashSales = await FlashSale.findFlashSalesByType(flashSaleType);
    } else {
      flashSales = await FlashSale.findValidFlashSales();
    }

    const availableFlashSales = flashSales.filter(flashSale => {
      return orderAmount >= flashSale.minOrderAmount;
    });

    const flashSalesWithDiscounts = availableFlashSales.map(flashSale => ({
      _id: flashSale._id,
      title: flashSale.title,
      description: flashSale.description,
      image: flashSale.image,
      discountType: flashSale.discountType,
      discountValue: flashSale.discountValue,
      minOrderAmount: flashSale.minOrderAmount,
      maxDiscountAmount: flashSale.maxDiscountAmount,
      startTime: flashSale.startTime,
      endTime: flashSale.endTime,
      flashSaleType: flashSale.flashSaleType,
      position: flashSale.position,
      usageLimit: flashSale.usageLimit,
      usedCount: flashSale.usedCount,
      userUsageLimit: flashSale.userUsageLimit,
      applicablePrimeCategories: flashSale.applicablePrimeCategories,
      applicableCategories: flashSale.applicableCategories,
      applicableSubcategories: flashSale.applicableSubcategories,
      applicableBrands: flashSale.applicableBrands,
      discountAmount: flashSale.calculateDiscount(parseFloat(orderAmount))
    }));

    res.status(200).json({
      success: true,
      message: 'Active flash sales retrieved successfully',
      data: {
        flashSales: flashSalesWithDiscounts,
        totalCount: flashSalesWithDiscounts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active flash sales',
      error: error.message
    });
  }
};

export const getUpcomingFlashSales = async (req, res) => {
  try {
    const flashSales = await FlashSale.findUpcomingFlashSales();

    const upcomingFlashSales = flashSales.map(flashSale => ({
      _id: flashSale._id,
      title: flashSale.title,
      description: flashSale.description,
      image: flashSale.image,
      discountType: flashSale.discountType,
      discountValue: flashSale.discountValue,
      minOrderAmount: flashSale.minOrderAmount,
      maxDiscountAmount: flashSale.maxDiscountAmount,
      startTime: flashSale.startTime,
      endTime: flashSale.endTime,
      flashSaleType: flashSale.flashSaleType,
      position: flashSale.position,
      usageLimit: flashSale.usageLimit,
      userUsageLimit: flashSale.userUsageLimit,
      applicablePrimeCategories: flashSale.applicablePrimeCategories,
      applicableCategories: flashSale.applicableCategories,
      applicableSubcategories: flashSale.applicableSubcategories,
      applicableBrands: flashSale.applicableBrands
    }));

    res.status(200).json({
      success: true,
      message: 'Upcoming flash sales retrieved successfully',
      data: {
        flashSales: upcomingFlashSales,
        totalCount: upcomingFlashSales.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve upcoming flash sales',
      error: error.message
    });
  }
};

export const validateFlashSale = async (req, res) => {
  try {
    const { flashSaleId, orderAmount } = req.body;
    const userId = req.user?.id;

    if (!flashSaleId) {
      return res.status(400).json({
        success: false,
        message: 'Flash sale ID is required'
      });
    }

    const flashSale = await FlashSale.findById(flashSaleId);
    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Flash sale not found'
      });
    }

    const validation = flashSale.validateForOrder(orderAmount || 0, userId);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        data: {
          isValid: false,
          errors: validation.errors
        }
      });
    }

    const discountAmount = flashSale.calculateDiscount(orderAmount || 0);

    res.status(200).json({
      success: true,
      message: 'Flash sale is valid',
      data: {
        isValid: true,
        flashSale: {
          _id: flashSale._id,
          title: flashSale.title,
          description: flashSale.description,
          discountType: flashSale.discountType,
          discountValue: flashSale.discountValue,
          discountAmount,
          minOrderAmount: flashSale.minOrderAmount,
          maxDiscountAmount: flashSale.maxDiscountAmount,
          startTime: flashSale.startTime,
          endTime: flashSale.endTime
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate flash sale',
      error: error.message
    });
  }
};

export const toggleFlashSaleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const flashSale = await FlashSale.findById(id);
    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Flash sale not found'
      });
    }

    flashSale.isActive = !flashSale.isActive;
    await flashSale.save();

    res.status(200).json({
      success: true,
      message: `Flash sale ${flashSale.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { flashSale }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle flash sale status',
      error: error.message
    });
  }
};

export const incrementFlashSaleClick = async (req, res) => {
  try {
    const { id } = req.params;

    const flashSale = await FlashSale.findById(id);
    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Flash sale not found'
      });
    }

    flashSale.incrementClickCount();
    await flashSale.save();

    res.status(200).json({
      success: true,
      message: 'Flash sale click count updated successfully',
      data: { clickCount: flashSale.clickCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update flash sale click count',
      error: error.message
    });
  }
};
