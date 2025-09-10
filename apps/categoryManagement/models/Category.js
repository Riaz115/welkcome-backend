import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
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
  primeCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrimeCategory',
    required: [true, 'Prime category is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

categorySchema.virtual('categoryCount', {
  ref: 'Subcategory',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

categorySchema.virtual('totalProducts').get(async function() {
  const Subcategory = mongoose.model('Subcategory');
  const subcategories = await Subcategory.find({ categoryId: this._id });
  return subcategories.reduce((total, sub) => total + (sub.productCount || 0), 0);
});

categorySchema.virtual('primeCategory', {
  ref: 'PrimeCategory',
  localField: 'primeCategoryId',
  foreignField: '_id',
  justOne: true
});

categorySchema.index({ name: 1, primeCategoryId: 1 }, { unique: true });
categorySchema.index({ serialNumber: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ primeCategoryId: 1 });
categorySchema.index({ createdAt: -1 });

categorySchema.methods.getWithCounts = async function() {
  await this.populate(['categoryCount', 'primeCategory']);
  return this;
};

const Category = mongoose.model('Category', categorySchema);

export default Category;