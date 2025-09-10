import Banner from '../models/bannerModel.js';
import { getS3ImageUrl } from '../middleware/upload.js';

export const createBanner = async (req, res) => {
  try {
    const {
      title,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      applicableCategories,
      applicableSubcategories,
      applicableProducts,
      excludedProducts,
      applicableBrands,
      bannerType,
      position
    } = req.body;

    const image = req.file ? req.file.location : req.body.image;

    if (!title || !image || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, image, discountType, discountValue, validFrom, validUntil'
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

    const banner = new Banner({
      title,
      description,
      image,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      applicableCategories,
      applicableSubcategories,
      applicableProducts,
      excludedProducts,
      applicableBrands,
      bannerType: bannerType || 'general',
      position: position || 0,
      createdBy: req.user.id
    });

    await banner.save();

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: { banner }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message
    });
  }
};

export const getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', bannerType } = req.query;
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

    if (bannerType) {
      filter.bannerType = bannerType;
    }

    const banners = await Banner.find(filter)
      .populate('createdBy', 'name email')
      .sort({ position: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Banner.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Banners retrieved successfully',
      data: {
        banners,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBanners: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve banners',
      error: error.message
    });
  }
};

export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'title brand')
      .populate('excludedProducts', 'title brand');

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banner retrieved successfully',
      data: { banner }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve banner',
      error: error.message
    });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    

    if (req.file) {
      updateData.image = req.file.location;
    }

    delete updateData.createdBy;
    delete updateData.clickCount;

    const banner = await Banner.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: { banner }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message
    });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message
    });
  }
};

export const getActiveBanners = async (req, res) => {
  try {
    const { bannerType, orderAmount = 0 } = req.query;

    let banners;
    if (bannerType) {
      banners = await Banner.findBannersByType(bannerType);
    } else {
      banners = await Banner.findValidBanners();
    }

    const availableBanners = banners.filter(banner => {
      return orderAmount >= banner.minOrderAmount;
    });

    const bannersWithDiscounts = availableBanners.map(banner => ({
      _id: banner._id,
      title: banner.title,
      description: banner.description,
      image: banner.image,
      discountType: banner.discountType,
      discountValue: banner.discountValue,
      minOrderAmount: banner.minOrderAmount,
      maxDiscountAmount: banner.maxDiscountAmount,
      validUntil: banner.validUntil,
      bannerType: banner.bannerType,
      position: banner.position,
      discountAmount: banner.calculateDiscount(parseFloat(orderAmount))
    }));

    res.status(200).json({
      success: true,
      message: 'Active banners retrieved successfully',
      data: {
        banners: bannersWithDiscounts,
        totalCount: bannersWithDiscounts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active banners',
      error: error.message
    });
  }
};

export const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { banner }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle banner status',
      error: error.message
    });
  }
};

export const incrementBannerClick = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    banner.incrementClickCount();
    await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner click count updated successfully',
      data: { clickCount: banner.clickCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update banner click count',
      error: error.message
    });
  }
};
