import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    maxlength: [100, 'Subcategory name cannot exceed 100 characters']
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  image: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  productCount: {
    type: Number,
    default: 0,
    min: [0, 'Product count cannot be negative']
  },
  stockStatus: {
    type: String,
    enum: ['In Stock', 'Out of Stock'],
    default: 'In Stock'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

subcategorySchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
  populate: {
    path: 'primeCategory',
    select: 'name'
  }
});

subcategorySchema.index({ name: 1, categoryId: 1 }, { unique: true });
subcategorySchema.index({ serialNumber: 1 });
subcategorySchema.index({ status: 1 });
subcategorySchema.index({ stockStatus: 1 });
subcategorySchema.index({ categoryId: 1 });
subcategorySchema.index({ createdAt: -1 });

subcategorySchema.methods.getWithHierarchy = async function() {
  await this.populate({
    path: 'category',
    populate: {
      path: 'primeCategory',
      select: 'name'
    }
  });
  return this;
};

subcategorySchema.statics.updateStockStatus = async function(subcategoryId) {
  const subcategory = await this.findById(subcategoryId);
  if (subcategory) {
    subcategory.stockStatus = subcategory.productCount > 0 ? 'In Stock' : 'Out of Stock';
    await subcategory.save();
  }
};

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

export default Subcategory;