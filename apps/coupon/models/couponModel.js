import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
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
    default: null // Only applicable for percentage discounts
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  userUsageLimit: {
    type: Number,
    default: 1 // How many times a single user can use this coupon
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
  firstTimeUserOnly: {
    type: Boolean,
    default: false
  },
  newUserOnly: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUsedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ createdBy: 1 });
couponSchema.index({ usedCount: 1 });

// Virtual to check if coupon is currently valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.validFrom <= now && 
         this.validUntil >= now &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
});

// Virtual to check if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

// Virtual to check if usage limit is reached
couponSchema.virtual('isUsageLimitReached').get(function() {
  return this.usageLimit !== null && this.usedCount >= this.usageLimit;
});

// Method to validate coupon for a specific order
couponSchema.methods.validateForOrder = function(orderAmount, userId, userOrderHistory = []) {
  const validation = {
    isValid: true,
    errors: []
  };

  // Check if coupon is active
  if (!this.isActive) {
    validation.isValid = false;
    validation.errors.push('Coupon is not active');
    return validation;
  }

  // Check validity period
  const now = new Date();
  if (this.validFrom > now) {
    validation.isValid = false;
    validation.errors.push('Coupon is not yet valid');
    return validation;
  }

  if (this.validUntil < now) {
    validation.isValid = false;
    validation.errors.push('Coupon has expired');
    return validation;
  }

  // Check usage limit
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    validation.isValid = false;
    validation.errors.push('Coupon usage limit has been reached');
    return validation;
  }

  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    validation.isValid = false;
    validation.errors.push(`Minimum order amount of ${this.minOrderAmount} is required`);
    return validation;
  }

  // Check usage limit
  if (this.isUsageLimitReached) {
    validation.isValid = false;
    validation.errors.push('Coupon usage limit has been reached');
    return validation;
  }

  // Check user usage limit
  const userUsageCount = userOrderHistory.filter(order => 
    order.appliedCoupon && order.appliedCoupon.couponCode === this.code
  ).length;

  if (userUsageCount >= this.userUsageLimit) {
    validation.isValid = false;
    validation.errors.push('You have already used this coupon maximum number of times');
    return validation;
  }

  return validation;
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  let discountAmount = 0;

  if (this.discountType === 'percentage') {
    discountAmount = (orderAmount * this.discountValue) / 100;
    
    // Apply maximum discount limit if set
    if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(this.discountValue, orderAmount);
  }

  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
};

// Method to increment usage count
couponSchema.methods.incrementUsage = function() {
  this.usedCount += 1;
  this.lastUsedAt = new Date();
};

// Pre-save middleware to validate discount values
couponSchema.pre('save', function(next) {
  // Validate percentage discount
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }

  // Validate fixed discount
  if (this.discountType === 'fixed' && this.discountValue <= 0) {
    return next(new Error('Fixed discount must be greater than 0'));
  }

  // Validate date range
  if (this.validFrom >= this.validUntil) {
    return next(new Error('Valid from date must be before valid until date'));
  }

  next();
});

// Static method to find valid coupons
couponSchema.statics.findValidCoupons = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
    ]
  });
};

// Static method to find coupon by code
couponSchema.statics.findByCode = function(code) {
  return this.findOne({ 
    code: code.toUpperCase().trim(),
    isActive: true 
  });
};

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

export default Coupon;
