// models/Product.js
import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Size", "Color"
  value: { type: String, required: true } // e.g., "XL", "Black"
}, { _id: false });

const productSchema = new mongoose.Schema({
  id: { type: String, required: false, index: true },
  sku: { type: String, required: false, index: true },
  name: { type: String, required: true, trim: true },
  subtitle: { type: String, default: '' },
  brand: { type: String, required: true, trim: true },
  description: { type: String, required: false, default: '' },
  media: {
    coverImage: { type: String, required: false },
    images: [{ type: String }],
    videos: [{ type: String }],
  },
  pricing: {
    basePrice: { type: Number, required: false, default: 0 },
    discountPercent: { type: Number, default: 0 },
  },
  category: {
    primeCategory: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
  },
  variants: [variantSchema], // flat list for searchability
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
