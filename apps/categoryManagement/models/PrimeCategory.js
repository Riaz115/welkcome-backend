import mongoose from 'mongoose';

const primeCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Prime category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Prime category name cannot exceed 100 characters']
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

primeCategorySchema.virtual('categoryCount', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'primeCategoryId',
  count: true
});

primeCategorySchema.virtual('totalProducts').get(async function() {
  const Category = mongoose.model('Category');
  const Subcategory = mongoose.model('Subcategory');
  
  const categories = await Category.find({ primeCategoryId: this._id });
  const categoryIds = categories.map(cat => cat._id);
  
  const subcategories = await Subcategory.find({ categoryId: { $in: categoryIds } });
  return subcategories.reduce((total, sub) => total + (sub.productCount || 0), 0);
});

primeCategorySchema.index({ name: 1 });
primeCategorySchema.index({ serialNumber: 1 });
primeCategorySchema.index({ status: 1 });
primeCategorySchema.index({ createdAt: -1 });

primeCategorySchema.methods.getWithCounts = async function() {
  await this.populate('categoryCount');
  return this;
};

const PrimeCategory = mongoose.model('PrimeCategory', primeCategorySchema);

export default PrimeCategory;