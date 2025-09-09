import Coupon from '../models/couponModel.js';
import Cart from '../../cart/models/cartModel.js';
import User from '../../user/models/userModel.js';

// Create new coupon (Admin only)
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit,
      validFrom,
      validUntil,
      applicableCategories,
      applicableProducts,
      excludedProducts,
      applicableBrands,
      firstTimeUserOnly,
      newUserOnly
    } = req.body;

    // Validate required fields
    if (!code || !name || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: code, name, discountType, discountValue, validFrom, validUntil'
      });
    }

    // Validate discount values
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

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      name,
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      usageLimit,
      userUsageLimit: userUsageLimit || 1,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      applicableCategories,
      applicableProducts,
      excludedProducts,
      applicableBrands,
      firstTimeUserOnly: firstTimeUserOnly || false,
      newUserOnly: newUserOnly || false,
      createdBy: req.user.id
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: { coupon }
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create coupon',
      error: error.message
    });
  }
};

// Get all coupons (Admin only)
export const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    
    if (status === 'active') {
      const now = new Date();
      filter = {
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now }
      };
    } else if (status === 'expired') {
      filter = {
        validUntil: { $lt: new Date() }
      };
    } else if (status === 'inactive') {
      filter = {
        isActive: false
      };
    }

    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Coupons retrieved successfully',
      data: {
        coupons,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCoupons: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve coupons',
      error: error.message
    });
  }
};

// Get coupon by ID
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'title brand')
      .populate('excludedProducts', 'title brand');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon retrieved successfully',
      data: { coupon }
    });
  } catch (error) {
    console.error('Get coupon by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve coupon',
      error: error.message
    });
  }
};

// Update coupon (Admin only)
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.createdBy;
    delete updateData.usedCount;
    delete updateData.lastUsedAt;

    // If code is being updated, check for duplicates
    if (updateData.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: { coupon }
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coupon',
      error: error.message
    });
  }
};

// Delete coupon (Admin only)
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coupon',
      error: error.message
    });
  }
};

// Validate coupon code
export const validateCoupon = async (req, res) => {
  try {
    const { couponCode, orderAmount } = req.body;
    const userId = req.user?.id;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    const coupon = await Coupon.findByCode(couponCode);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Validate coupon for the order
    const validation = coupon.validateForOrder(orderAmount || 0, userId);
    
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

    // Calculate discount amount
    const discountAmount = coupon.calculateDiscount(orderAmount || 0);

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      data: {
        isValid: true,
        coupon: {
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscountAmount: coupon.maxDiscountAmount
        }
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon',
      error: error.message
    });
  }
};

// Get available coupons for user
export const getAvailableCoupons = async (req, res) => {
  try {
    const { orderAmount = 0 } = req.query;
    const userId = req.user?.id;

    const validCoupons = await Coupon.findValidCoupons();

    // Filter coupons based on order amount and user eligibility
    const availableCoupons = validCoupons.filter(coupon => {
      // Check minimum order amount
      if (orderAmount < coupon.minOrderAmount) {
        return false;
      }

      // Check user usage limit if user is logged in
      if (userId && coupon.userUsageLimit) {
        // This would require order history - for now, we'll skip this check
        // In a real implementation, you'd check user's order history
      }

      return true;
    });

    // Calculate discount amounts for each coupon
    const couponsWithDiscounts = availableCoupons.map(coupon => ({
      _id: coupon._id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      validUntil: coupon.validUntil,
      discountAmount: coupon.calculateDiscount(parseFloat(orderAmount))
    }));

    res.status(200).json({
      success: true,
      message: 'Available coupons retrieved successfully',
      data: {
        coupons: couponsWithDiscounts,
        totalCount: couponsWithDiscounts.length
      }
    });
  } catch (error) {
    console.error('Get available coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available coupons',
      error: error.message
    });
  }
};

// Toggle coupon status (Admin only)
export const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { coupon }
    });
  } catch (error) {
    console.error('Toggle coupon status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle coupon status',
      error: error.message
    });
  }
};
