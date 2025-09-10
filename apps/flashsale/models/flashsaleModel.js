import mongoose from 'mongoose';

const flashsaleSchema = new mongoose.Schema({
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
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicablePrimeCategories: [{
    type: String,
    trim: true
  }],
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
  usageLimit: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  userUsageLimit: {
    type: Number,
    default: 1
  },
  flashSaleType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special'],
    default: 'special'
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
  },
  lastUsedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

flashsaleSchema.index({ isActive: 1, startTime: 1, endTime: 1 });
flashsaleSchema.index({ flashSaleType: 1, position: 1 });
flashsaleSchema.index({ createdBy: 1 });

flashsaleSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startTime <= now && 
         this.endTime >= now &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
});

flashsaleSchema.virtual('isExpired').get(function() {
  return new Date() > this.endTime;
});

flashsaleSchema.virtual('isNotStarted').get(function() {
  return new Date() < this.startTime;
});

flashsaleSchema.virtual('isUsageLimitReached').get(function() {
  return this.usageLimit !== null && this.usedCount >= this.usageLimit;
});

flashsaleSchema.methods.calculateDiscount = function(orderAmount) {
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

flashsaleSchema.methods.incrementUsage = function() {
  this.usedCount += 1;
  this.lastUsedAt = new Date();
};

flashsaleSchema.methods.incrementClickCount = function() {
  this.clickCount += 1;
};

flashsaleSchema.methods.validateForOrder = function(orderAmount, userId, userOrderHistory = []) {
  const validation = {
    isValid: true,
    errors: []
  };

  if (!this.isActive) {
    validation.isValid = false;
    validation.errors.push('Flash sale is not active');
    return validation;
  }

  const now = new Date();
  if (this.startTime > now) {
    validation.isValid = false;
    validation.errors.push('Flash sale has not started yet');
    return validation;
  }

  if (this.endTime < now) {
    validation.isValid = false;
    validation.errors.push('Flash sale has ended');
    return validation;
  }

  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    validation.isValid = false;
    validation.errors.push('Flash sale usage limit has been reached');
    return validation;
  }

  if (orderAmount < this.minOrderAmount) {
    validation.isValid = false;
    validation.errors.push(`Minimum order amount of ${this.minOrderAmount} is required`);
    return validation;
  }

  if (userId && this.userUsageLimit) {
    const userUsageCount = userOrderHistory.filter(order => 
      order.appliedFlashSale && order.appliedFlashSale.flashSaleId.toString() === this._id.toString()
    ).length;

    if (userUsageCount >= this.userUsageLimit) {
      validation.isValid = false;
      validation.errors.push('You have already used this flash sale maximum number of times');
      return validation;
    }
  }

  return validation;
};

flashsaleSchema.pre('save', function(next) {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }

  if (this.discountType === 'fixed' && this.discountValue <= 0) {
    return next(new Error('Fixed discount must be greater than 0'));
  }

  if (this.startTime >= this.endTime) {
    return next(new Error('Start time must be before end time'));
  }

  next();
});

flashsaleSchema.statics.findValidFlashSales = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
    ]
  }).sort({ position: 1, createdAt: -1 });
};

flashsaleSchema.statics.findFlashSalesByType = function(flashSaleType) {
  const now = new Date();
  return this.find({
    flashSaleType,
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
    ]
  }).sort({ position: 1, createdAt: -1 });
};

flashsaleSchema.statics.findUpcomingFlashSales = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startTime: { $gt: now }
  }).sort({ startTime: 1 });
};

const FlashSale = mongoose.models.FlashSale || mongoose.model('FlashSale', flashsaleSchema);

export default FlashSale;
