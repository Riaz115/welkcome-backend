import mongoose from 'mongoose';

const variantCombinationSchema = new mongoose.Schema({
  Color: { type: String, default: null },
  Size: { type: String, default: null },
}, { _id: false });

const variantSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  variantType: { type: String, required: true },
  variantValue: { type: String, required: true },
  size: { type: String, default: null },
  sku: { type: String, default: '' },
  mrp: { type: String, required: true },
  discount: { type: String, required: true },
  discountedPrice: { type: String, required: true },
  finalPrice: { type: String, required: true },
  stock: { type: String, required: true },
  barcode: { type: String, default: '' },
  image: { type: String, default: null },
  images: [{
    file: {
      path: { type: String, default: '' },
      relativePath: { type: String, default: '' }
    },
    preview: { type: String, default: '' },
    name: { type: String, default: '' },
    size: { type: Number, default: 0 }
  }],
  variantCombination: variantCombinationSchema
}, { _id: false });

const variantTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },
  values: [{ type: String }]
}, { _id: false });

const variantSizesSchema = new mongoose.Schema({
}, { _id: false, strict: false });

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: true },
  subtitle: { type: String, default: '', trim: true },
  brand: { type: String, required: true, trim: true, index: true },
  brandId: { type: String, required: true, index: true },
  primeCategory: { type: String, required: true, trim: true, index: true },
  category: { type: String, required: true, trim: true, index: true },
  subcategory: { type: String, default: '', trim: true, index: true },
  primeCategoryId: { type: String, required: true, index: true },
  categoryId: { type: String, required: true, index: true },
  subcategoryId: { type: String, default: '', index: true },
  description: { type: String, default: '', trim: true },
  images: [{
    file: {
      path: { type: String, required: true },
      relativePath: { type: String, required: true }
    },
    preview: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true }
  }],
  video: {
    file: { type: mongoose.Schema.Types.Mixed, default: {} },
    preview: { type: String, default: '' },
    name: { type: String, default: '' },
    size: { type: Number, default: 0 }
  },
  coverImage: { type: String, default: '' },
  videos: [{
    file: {
      path: { type: String, default: '' },
      relativePath: { type: String, default: '' }
    },
    preview: { type: String, default: '' },
    name: { type: String, default: '' },
    size: { type: Number, default: 0 }
  }],
  seoSlug: { type: String, required: true, unique: true, index: true },
  visibility: { 
    type: String, 
    enum: ['public', 'private', 'draft'], 
    default: 'public' 
  },
  variantMode: { 
    type: String, 
    enum: ['single', 'multi'], 
    default: 'single' 
  },
  variantTypes: [variantTypeSchema],
  colorValues: [{ type: String }],
  modelValues: { type: String, default: '' },
  customVariantName: { type: String, default: '' },
  customVariantValues: { type: String, default: '' },
  enableSizeMatrix: { type: Boolean, default: false },
  sizes: [{ type: String }],
  variants: [variantSchema],
  variantSizes: variantSizesSchema,
  tags: [{ type: String, index: true }],
  name: { type: String, default: '' },
  weight: { type: String, default: '' },
  color: { type: String, default: '' },
  productCollection: { type: String, default: '' },
  price: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number, default: 0 },
  currency: { 
    type: String, 
    enum: ['usd', 'eur', 'gbp', 'inr'], 
    default: 'usd' 
  },
  newColorValue: { type: String, default: '' },
  id: { type: String },
  sku: { type: String },
  pricing: {
    basePrice: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 }
  },
  category: {
    primeCategory: { type: String, default: '' },
    category: { type: String, default: '' },
    subCategory: { type: String, default: '' }
  },
  legacyVariants: [{
    name: { type: String, required: true },
    value: { type: String, required: true }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  rejectionReason: { type: String, default: '' },
  creator: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { 
      type: String, 
      enum: ['admin', 'seller'], 
      required: true 
    },
    name: { type: String, required: true },
    email: { type: String, required: true }
  }
  
}, { 
  timestamps: true,
  strict: false 
});

  productSchema.index({ title: 'text', description: 'text', brand: 'text' });
  productSchema.index({ 'category.primeCategory': 1, 'category.category': 1, 'category.subCategory': 1 });
  productSchema.index({ visibility: 1 });
  productSchema.index({ createdAt: -1 });
  productSchema.index({ updatedAt: -1 });

productSchema.pre('save', function(next) {
  if (!this.seoSlug) {
    this.seoSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
