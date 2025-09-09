import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: Number,
    default: null
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  variantDetails: {
    color: { type: String, default: null },
    size: { type: String, default: null },
    sku: { type: String, default: '' }
  }
}, { _id: true });

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [wishlistItemSchema],
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

wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ 'items.productId': 1 });
wishlistSchema.index({ lastUpdated: -1 });

wishlistSchema.virtual('calculatedItemCount').get(function() {
  return this.items.length;
});

wishlistSchema.pre('save', function(next) {
  this.itemCount = this.calculatedItemCount;
  this.lastUpdated = new Date();
  next();
});

wishlistSchema.methods.addItem = function(productId, variantId, variantDetails = {}) {
  const existingItemIndex = this.items.findIndex(item => 
    item.productId.toString() === productId.toString() && 
    item.variantId === variantId
  );

  if (existingItemIndex === -1) {
    this.items.push({
      productId,
      variantId: variantId || null,
      addedAt: new Date(),
      variantDetails
    });
  }
};

wishlistSchema.methods.removeItem = function(productId, variantId) {
  this.items = this.items.filter(item => 
    !(item.productId.toString() === productId.toString() && item.variantId === variantId)
  );
};

wishlistSchema.methods.clearWishlist = function() {
  this.items = [];
  this.itemCount = 0;
};

wishlistSchema.methods.isItemInWishlist = function(productId, variantId) {
  return this.items.some(item => 
    item.productId.toString() === productId.toString() && 
    item.variantId === variantId
  );
};

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
