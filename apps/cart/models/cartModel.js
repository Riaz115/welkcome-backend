import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: Number,
    default: null // For products with variants
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  price: {
    type: Number,
    required: true
  },
  discountedPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  variantDetails: {
    color: { type: String, default: null },
    size: { type: String, default: null },
    sku: { type: String, default: '' }
  }
}, { _id: true });

const appliedCouponSchema = new mongoose.Schema({
  couponCode: {
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
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  appliedCoupon: appliedCouponSchema,
  subtotal: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  itemCount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
cartSchema.index({ userId: 1 });
cartSchema.index({ 'items.productId': 1 });
cartSchema.index({ lastUpdated: -1 });

// Virtual for calculating totals
cartSchema.virtual('calculatedSubtotal').get(function() {
  return this.items.reduce((total, item) => total + item.totalPrice, 0);
});

cartSchema.virtual('calculatedItemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.subtotal = this.calculatedSubtotal;
  this.itemCount = this.calculatedItemCount;
  this.lastUpdated = new Date();
  
  // Calculate discount if coupon is applied
  if (this.appliedCoupon) {
    if (this.appliedCoupon.discountType === 'percentage') {
      this.discountAmount = (this.subtotal * this.appliedCoupon.discountValue) / 100;
    } else {
      this.discountAmount = Math.min(this.appliedCoupon.discountValue, this.subtotal);
    }
  } else {
    this.discountAmount = 0;
  }
  
  this.totalAmount = this.subtotal - this.discountAmount;
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, variantId, quantity, price, discountedPrice, variantDetails = {}) {
  const existingItemIndex = this.items.findIndex(item => 
    item.productId.toString() === productId.toString() && 
    item.variantId === variantId
  );

  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].totalPrice = this.items[existingItemIndex].quantity * this.items[existingItemIndex].discountedPrice;
  } else {
    // Add new item
    this.items.push({
      productId,
      variantId,
      quantity,
      price,
      discountedPrice,
      totalPrice: quantity * discountedPrice,
      variantDetails
    });
  }
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId, variantId) {
  this.items = this.items.filter(item => 
    !(item.productId.toString() === productId.toString() && item.variantId === variantId)
  );
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, variantId, quantity) {
  const item = this.items.find(item => 
    item.productId.toString() === productId.toString() && 
    item.variantId === variantId
  );
  
  if (item) {
    item.quantity = quantity;
    item.totalPrice = quantity * item.discountedPrice;
  }
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.appliedCoupon = undefined;
  this.subtotal = 0;
  this.discountAmount = 0;
  this.totalAmount = 0;
  this.itemCount = 0;
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function(coupon) {
  this.appliedCoupon = {
    couponCode: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    appliedAt: new Date()
  };
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function() {
  this.appliedCoupon = undefined;
};

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

export default Cart;
