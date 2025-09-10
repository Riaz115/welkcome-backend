import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: null
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableCategories: [{
    type: String,
    trim: true
  }],
  applicableSubcategories: [{
    type: String,
    trim: true
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableBrands: [{
    type: String,
    trim: true
  }],
  bannerType: {
    type: String,
    enum: ['homepage', 'category', 'product', 'general'],
    default: 'general'
  },
  position: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

bannerSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
bannerSchema.index({ bannerType: 1, position: 1 });
bannerSchema.index({ createdBy: 1 });

bannerSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.validFrom <= now && 
         this.validUntil >= now;
});

bannerSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

bannerSchema.methods.calculateDiscount = function(orderAmount) {
  let discountAmount = 0;

  if (this.discountType === 'percentage') {
    discountAmount = (orderAmount * this.discountValue) / 100;
    
    if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(this.discountValue, orderAmount);
  }

  return Math.round(discountAmount * 100) / 100;
};

bannerSchema.methods.incrementClickCount = function() {
  this.clickCount += 1;
};

bannerSchema.pre('save', function(next) {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }

  if (this.discountType === 'fixed' && this.discountValue <= 0) {
    return next(new Error('Fixed discount must be greater than 0'));
  }

  if (this.validFrom >= this.validUntil) {
    return next(new Error('Valid from date must be before valid until date'));
  }

  next();
});

bannerSchema.statics.findValidBanners = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  }).sort({ position: 1, createdAt: -1 });
};

bannerSchema.statics.findBannersByType = function(bannerType) {
  const now = new Date();
  return this.find({
    bannerType,
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  }).sort({ position: 1, createdAt: -1 });
};

const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

export default Banner;
