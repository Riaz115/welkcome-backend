import Product from '../models/productModel.js';
import mongoose from 'mongoose';
import { getS3ImageUrl } from '../middleware/upload.js';

// Create a new product
export const createProduct = async (req, res) => {
    
    try {
        const body = req.body || {};
        // Frontend sends fields like: title, subtitle, brand, brandId, primeCategory, category, subcategory, description, variants (JSON), images (files)
        const {
            id,
            sku,
            subtitle,
            brandId,
            description,
            currency,
            variantMode,
            variants: variantsJson
        } = body;

        // Normalize common field names coming from FormData
        const title = (body.title || body.name || body.productTitle || '').toString();
        const brand = (body.brand || body.brandName || '').toString();
        const primeCategory = (body.primeCategory || body.prime_category || '').toString();
        const category = (body.category || body.categoryName || '').toString();
        const subcategory = (body.subcategory || body.subCategory || '').toString();

        const uploadedImages = (req.files || [])
            .map(f => f.location || getS3ImageUrl(f.key) || f.path)
            .filter(Boolean);

        // Validate required fields
        if (!title || !brand) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, brand'
            });
        }

        // Pricing validation is driven from variants in this payload; skip top-level pricing validation

        // Create new product
        let parsedVariants = [];
        try {
            if (variantsJson) {
                parsedVariants = typeof variantsJson === 'string' ? JSON.parse(variantsJson) : variantsJson;
            } else if (body.variants) {
                parsedVariants = typeof body.variants === 'string' ? JSON.parse(body.variants) : body.variants;
            }
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid variants JSON' });
        }

        // flatten variants: for each variant item, push name/value pairs present
        const flatVariants = [];
        parsedVariants.forEach(v => {
            if (v && v.name) flatVariants.push({ name: 'Variant', value: v.name });
            if (v && v.sku) flatVariants.push({ name: 'SKU', value: v.sku });
            if (v && v.barcode) flatVariants.push({ name: 'Barcode', value: v.barcode });
        });

        const generatedId = (id && String(id).trim()) || String(Date.now());
        const generatedSku = (sku && String(sku).trim()) || `SKU-${generatedId}`;

        const newProduct = new Product({
            id: generatedId,
            sku: generatedSku,
            name: title.trim(),
            subtitle: subtitle?.trim() || '',
            brand: brand.trim(),
            description: (description || '').trim(),
            media: {
                coverImage: uploadedImages[0] || null,
                images: uploadedImages,
                videos: []
            },
            pricing: {
                basePrice: parsedVariants?.[0]?.finalPrice ? Number(parsedVariants[0].finalPrice) : 0,
                discountPercent: 0
            },
            category: {
                primeCategory: primeCategory || '',
                category: category || '',
                subCategory: subcategory || ''
            },
            variants: flatVariants
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: savedProduct
        });

    } catch (error) {
        console.error('Error creating product:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this name already exists'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

// Get all products with filtering and pagination
export const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            primeCategory,
            category,
            subCategory,
            minPrice,
            maxPrice,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};

        if (primeCategory) filter['category.primeCategory'] = primeCategory;
        if (category) filter['category.category'] = category;
        if (subCategory) filter['category.subCategory'] = subCategory;

        // Price range filter
        if (minPrice || maxPrice) {
            filter['pricing.basePrice'] = {};
            if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
            if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
        }

        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { 'variants.name': { $regex: search, $options: 'i' } },
                { 'variants.value': { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean();

        // Optional: map S3 keys to full URLs
        products.forEach(p => {
            if (p.media && Array.isArray(p.media.images)) {
                p.media.images = p.media.images.map(getS3ImageUrl);
            }
            if (p.media && p.media.coverImage) {
                p.media.coverImage = getS3ImageUrl(p.media.coverImage);
            }
        });

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / Number(limit));

        res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
                products,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalProducts,
                    hasNextPage: Number(page) < totalPages,
                    hasPrevPage: Number(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

// Get single product by ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const product = await Product.findById(id).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Map S3 keys to full URLs in response
        if (product?.media?.images) {
            product.media.images = product.media.images.map(getS3ImageUrl);
        }
        if (product?.media?.coverImage) {
            product.media.coverImage = getS3ImageUrl(product.media.coverImage);
        }

        res.status(200).json({
            success: true,
            message: 'Product retrieved successfully',
            data: product
        });

    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        // Merge any newly uploaded images (keep existing ones unless explicitly replaced)
        const newlyUploaded = (req.files || [])
            .map(f => f.location || getS3ImageUrl(f.key) || f.path)
            .filter(Boolean);

        if (newlyUploaded.length > 0) {
            // Initialize media if missing
            if (!updateData.media) updateData.media = {};

            // If client sent explicit images array, prefer replacing; otherwise append
            if (Array.isArray(updateData.images)) {
                updateData.media.images = updateData.images.concat(newlyUploaded);
                delete updateData.images;
            } else if (Array.isArray(updateData.media?.images)) {
                updateData.media.images = [...new Set([...
                    updateData.media.images,
                    ...newlyUploaded,
                ])];
            } else {
                updateData.media.images = newlyUploaded;
            }

            // Cover image default to first image if not provided
            if (!updateData.media.coverImage && updateData.media.images.length > 0) {
                updateData.media.coverImage = updateData.media.images[0];
            }
        }

        // Validate pricing if provided
        if (updateData.pricing?.basePrice && updateData.pricing.basePrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Base price must be greater than 0'
            });
        }

        if (updateData.pricing?.discountPercent && 
            (updateData.pricing.discountPercent < 0 || updateData.pricing.discountPercent > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Discount percent must be between 0 and 100'
            });
        }

        // Trim string fields if provided
        if (updateData.name) updateData.name = updateData.name.trim();
        if (updateData.description) updateData.description = updateData.description.trim();

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });

    } catch (error) {
        console.error('Error updating product:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            data: deletedProduct
        });

    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
    try {
        const { primeCategory, category, subCategory } = req.params;
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Build filter
        const filter = {
            'category.primeCategory': primeCategory,
            'category.category': category
        };

        if (subCategory) {
            filter['category.subCategory'] = subCategory;
        }

        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / Number(limit));

        res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
                products,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalProducts,
                    hasNextPage: Number(page) < totalPages,
                    hasPrevPage: Number(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Error getting products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

// Get product statistics
export const getProductStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        
        const categoryStats = await Product.aggregate([
            {
                $group: {
                    _id: '$category.primeCategory',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$pricing.basePrice' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const priceStats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$pricing.basePrice' },
                    maxPrice: { $max: '$pricing.basePrice' },
                    avgPrice: { $avg: '$pricing.basePrice' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'Product statistics retrieved successfully',
            data: {
                totalProducts,
                categoryStats,
                priceStats: priceStats[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 }
            }
        });

    } catch (error) {
        console.error('Error getting product stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};