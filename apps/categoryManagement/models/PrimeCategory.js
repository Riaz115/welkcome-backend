import mongoose from 'mongoose';

const primeCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Prime category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Prime category name cannot exceed 100 characters']
  },
  // serialNumber: {
  //   type: String,
  //   required: [true, 'Serial number is required'],
  //   unique: true,
  //   trim: true,
  //   uppercase: true,
  //   match: [/^[A-Z]{2,3}[0-9]{4,6}$/, 'Invalid serial number format']
  // },

  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    // match: [/^[A-Z]{2,3}[0-9]{4,6}$/, 'Invalid serial number format']
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for category count
primeCategorySchema.virtual('categoryCount', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'primeCategoryId',
  count: true
});

// Virtual for total products count
primeCategorySchema.virtual('totalProducts').get(async function() {
  const Category = mongoose.model('Category');
  const Subcategory = mongoose.model('Subcategory');
  
  const categories = await Category.find({ primeCategoryId: this._id });
  const categoryIds = categories.map(cat => cat._id);
  
  const subcategories = await Subcategory.find({ categoryId: { $in: categoryIds } });
  return subcategories.reduce((total, sub) => total + (sub.productCount || 0), 0);
});

// Index for better query performance
primeCategorySchema.index({ name: 1 });
primeCategorySchema.index({ serialNumber: 1 });
primeCategorySchema.index({ status: 1 });
primeCategorySchema.index({ createdAt: -1 });

// Instance method to get category with counts
primeCategorySchema.methods.getWithCounts = async function() {
  await this.populate('categoryCount');
  return this;
};

const PrimeCategory = mongoose.model('PrimeCategory', primeCategorySchema);

export default PrimeCategory; 