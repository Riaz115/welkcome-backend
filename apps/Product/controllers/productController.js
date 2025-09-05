import Product from '../models/productModel.js';
import mongoose from 'mongoose';
import { getS3ImageUrl, getS3Url } from '../middleware/upload.js';

export const createProduct = async (req, res) => {
    try {
        const body = req.body || {};
        
        const {
            title,
            subtitle,
            brand,
            brandId,
            primeCategory,
            category,
            subcategory,
            description,
            tags,
            seoSlug,
            visibility,
            variantMode,
            variantTypes,
            colorValues,
            modelValues,
            customVariantName,
            customVariantValues,
            enableSizeMatrix,
            sizes,
            variants,
            variantSizes,
            name,
            weight,
            color,
            productCollection,
            price,
            currency,
            newColorValue,
            primeCategoryId,
            categoryId,
            subcategoryId
        } = body;

        if (!title || !brand || !brandId || !primeCategory || !category) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, brand, brandId, primeCategory, category'
            });
        }

        const uploadedImages = [];
        const uploadedVideos = [];
        let uploadedVideo = null;

        if (req.files && req.files.images) {
            const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
            imageFiles.forEach(file => {
                uploadedImages.push({
                    file: {
                        path: file.location || getS3Url(file.key) || file.path,
                        relativePath: file.key || file.path
                    },
                    preview: file.location || getS3Url(file.key) || file.path,
                    name: file.originalname,
                    size: file.size
                });
            });
        }

        if (req.files && req.files.videos) {
            const videoFiles = Array.isArray(req.files.videos) ? req.files.videos : [req.files.videos];
            videoFiles.forEach(file => {
                uploadedVideos.push({
                    file: {
                        path: file.location || getS3Url(file.key) || file.path,
                        relativePath: file.key || file.path
                    },
                    preview: file.location || getS3Url(file.key) || file.path,
                    name: file.originalname,
                    size: file.size
                });
            });
        }

        if (body.videos) {
            try {
                let videosData = body.videos;
                if (typeof body.videos === 'string') {
                    videosData = JSON.parse(body.videos);
                }
                
                if (Array.isArray(videosData)) {
                    videosData.forEach(video => {
                        if (video.file && video.file.path) {
                            uploadedVideos.push({
                                file: {
                                    path: video.file.path,
                                    relativePath: video.file.relativePath || video.file.path
                                },
                                preview: video.preview || '',
                                name: video.name || '',
                                size: video.size || 0
                            });
                        }
                    });
                }
            } catch (error) {
                // Silent error handling
            }
        }

        if (req.files && req.files.video) {
            const file = req.files.video;
            uploadedVideo = {
                file: {
                    path: file.location || getS3Url(file.key) || file.path,
                    relativePath: file.key || file.path
                },
                preview: file.location || getS3Url(file.key) || file.path,
                name: file.originalname,
                size: file.size
            };
        }

        if (body.video && typeof body.video === 'object') {
            uploadedVideo = body.video;
        }

        if (body.video && typeof body.video === 'string' && body.video !== '[object Object]') {
            try {
                const videoData = JSON.parse(body.video);
                if (videoData && videoData.file && videoData.name) {
                    uploadedVideo = videoData;
                }
            } catch (error) {
                // Silent error handling
            }
        }

        if (body.video === '[object Object]' && req.files && req.files.video) {
            const file = req.files.video;
            uploadedVideo = {
                file: {
                    path: file.location || getS3Url(file.key) || file.path,
                    relativePath: file.key || file.path
                },
                preview: file.location || getS3Url(file.key) || file.path,
                name: file.originalname,
                size: file.size
            };
        }

        if (!uploadedVideo && req.files && req.files.video) {
            const file = req.files.video;
            uploadedVideo = {
                file: {
                    path: file.location || getS3Url(file.key) || file.path,
                    relativePath: file.key || file.path
                },
                preview: file.location || getS3Url(file.key) || file.path,
                name: file.originalname,
                size: file.size
            };
        }

        let processedVariants = [];
        let legacyVariants = [];
        
        if (variants) {
            try {
                let variantsData = variants;
                if (typeof variants === 'string') {
                    variantsData = JSON.parse(variants);
                }
                
                if (Array.isArray(variantsData)) {
                    processedVariants = variantsData.map(variant => {
                        let processedImages = [];
                        if (variant.images && Array.isArray(variant.images)) {
                            processedImages = variant.images.map(img => {
                                if (img.file && img.file.path && img.file.path.startsWith('./')) {
                                    const fileName = img.file.path.split('/').pop();
                                    const uploadedImage = uploadedImages.find(uploaded => 
                                        uploaded.name === fileName
                                    );
                                    if (uploadedImage) {
                                        return {
                                            file: {
                                                path: uploadedImage.file.path,
                                                relativePath: uploadedImage.file.relativePath
                                            },
                                            preview: uploadedImage.preview,
                                            name: uploadedImage.name,
                                            size: uploadedImage.size
                                        };
                                    }
                                }
                                return img;
                            });
                        }

                        return {
                            id: variant.id,
                            name: variant.name,
                            variantType: variant.variantType,
                            variantValue: variant.variantValue,
                            size: variant.size,
                            sku: variant.sku || '',
                            mrp: variant.mrp,
                            discount: variant.discount,
                            discountedPrice: variant.discountedPrice,
                            finalPrice: variant.finalPrice,
                            stock: variant.stock,
                            barcode: variant.barcode || '',
                            image: variant.image,
                            images: processedImages,
                            variantCombination: variant.variantCombination || {}
                        };
                    });

                    legacyVariants = variantsData.map(variant => ({
                        name: variant.variantType || 'Variant',
                        value: variant.variantValue || variant.name
                    }));
                }
            } catch (error) {
                processedVariants = [];
                legacyVariants = [];
            }
        }

        let productPrice = 0, productDiscount = 0, productFinalPrice = 0;
        
        if (processedVariants.length > 0) {
            const finalPrices = processedVariants.map(v => Number(v.finalPrice) || 0).filter(p => p > 0);
            const discounts = processedVariants.map(v => Number(v.discount) || 0).filter(p => p > 0);
            
            if (finalPrices.length > 0) {
                productFinalPrice = Math.min(...finalPrices);
                productPrice = Math.min(...processedVariants.map(v => Number(v.mrp) || 0).filter(p => p > 0));
            }
            if (discounts.length > 0) {
                productDiscount = Math.max(...discounts);
            }
        }

        let generatedSeoSlug = seoSlug;
        if (!generatedSeoSlug) {
            generatedSeoSlug = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim('-');
        }

        let processedTags = [];
        if (tags) {
            try {
                if (typeof tags === 'string') {
                    processedTags = JSON.parse(tags);
                } else if (Array.isArray(tags)) {
                    processedTags = tags;
                }
            } catch (error) {
                processedTags = [];
            }
        }

        let processedVariantTypes = [];
        if (variantTypes) {
            try {
                if (typeof variantTypes === 'string') {
                    processedVariantTypes = JSON.parse(variantTypes);
                } else if (Array.isArray(variantTypes)) {
                    processedVariantTypes = variantTypes;
                }
            } catch (error) {
                processedVariantTypes = [];
            }
        }

        let processedColorValues = [];
        if (colorValues) {
            try {
                if (typeof colorValues === 'string') {
                    processedColorValues = JSON.parse(colorValues);
                } else if (Array.isArray(colorValues)) {
                    processedColorValues = colorValues;
                }
            } catch (error) {
                processedColorValues = [];
            }
        }

        let processedSizes = [];
        if (sizes) {
            try {
                if (typeof sizes === 'string') {
                    processedSizes = JSON.parse(sizes);
                } else if (Array.isArray(sizes)) {
                    processedSizes = sizes;
                }
            } catch (error) {
                processedSizes = [];
            }
        }

        let processedVariantSizes = {};
        if (variantSizes) {
            try {
                if (typeof variantSizes === 'string') {
                    processedVariantSizes = JSON.parse(variantSizes);
                } else if (typeof variantSizes === 'object') {
                    processedVariantSizes = variantSizes;
                }
            } catch (error) {
                processedVariantSizes = {};
            }
        }

        let productStatus = 'pending';
        let creatorInfo = {
            id: req.user._id,
            role: req.user.role,
            name: req.user.role === 'admin' ? `${req.user.firstName} ${req.user.lastName}` : req.user.name,
            email: req.user.email
        };

        if (req.user.role === 'admin') {
            productStatus = 'approved';
        }

        const newProduct = new Product({
            title: title.trim(),
            subtitle: subtitle?.trim() || '',
            brand: brand.trim(),
            brandId: brandId.trim(),
            primeCategory: primeCategory.trim(),
            category: category.trim(),
            subcategory: subcategory?.trim() || '',
            description: description?.trim() || '',
            tags: processedTags,
            seoSlug: generatedSeoSlug,
            visibility: visibility || 'public',
            variantMode: variantMode || 'single',
            variantTypes: processedVariantTypes,
            colorValues: processedColorValues,
            modelValues: modelValues || '',
            customVariantName: customVariantName || '',
            customVariantValues: customVariantValues || '',
            enableSizeMatrix: enableSizeMatrix === 'true' || enableSizeMatrix === true,
            sizes: processedSizes,
            variants: processedVariants,
            variantSizes: processedVariantSizes,
            name: name || '',
            weight: weight || '',
            color: color || '',
            productCollection: productCollection || '',
            price: productPrice,
            discount: productDiscount,
            finalPrice: productFinalPrice,
            currency: currency || 'usd',
            newColorValue: newColorValue || '',
            primeCategoryId: primeCategoryId || '',
            categoryId: categoryId || '',
            subcategoryId: subcategoryId || '',
            images: uploadedImages,
            video: uploadedVideo,
            videos: uploadedVideos,
            coverImage: uploadedImages.length > 0 ? uploadedImages[0].file.path : '',
            
            id: String(Date.now()),
            sku: `SKU-${Date.now()}`,
            pricing: {
                basePrice: processedVariants.length > 0 ? Number(processedVariants[0].finalPrice) : 0,
                discountPercent: 0
            },
            category: {
                primeCategory: primeCategory,
                category: category,
                subCategory: subcategory
            },
            legacyVariants: legacyVariants,
            status: productStatus,
            creator: creatorInfo
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: savedProduct
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this SEO slug already exists'
            });
        }

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

export const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            primeCategory,
            category,
            subcategory,
            minPrice,
            maxPrice,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            visibility,
            brandId,
            tags
        } = req.query;

        const filter = {};

        if (primeCategory) filter.primeCategory = primeCategory;
        if (category) filter.category = category;
        if (subcategory) filter.subcategory = subcategory;
        if (visibility) filter.visibility = visibility;
        if (brandId) filter.brandId = brandId;

        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            filter.tags = { $in: tagArray };
        }

        if (minPrice || maxPrice) {
            filter['variants.finalPrice'] = {};
            if (minPrice) filter['variants.finalPrice'].$gte = Number(minPrice);
            if (maxPrice) filter['variants.finalPrice'].$lte = Number(maxPrice);
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
                { 'variants.name': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

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
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

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

        res.status(200).json({
            success: true,
            message: 'Product retrieved successfully',
            data: product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        if (updateData.modelValues) {
            if (Array.isArray(updateData.modelValues)) {
                updateData.modelValues = updateData.modelValues.join(', ');
            }
        }

        if (updateData.colorValues) {
            if (typeof updateData.colorValues === 'string') {
                try {
                    updateData.colorValues = JSON.parse(updateData.colorValues);
                } catch (error) {
                    updateData.colorValues = updateData.colorValues.split(',').map(item => item.trim());
                }
            }
        }

        if (updateData.customVariantValues) {
            if (Array.isArray(updateData.customVariantValues)) {
                updateData.customVariantValues = updateData.customVariantValues.join(', ');
            }
        }

        if (updateData.tags) {
            if (typeof updateData.tags === 'string') {
                try {
                    updateData.tags = JSON.parse(updateData.tags);
                } catch (error) {
                    updateData.tags = updateData.tags.split(',').map(item => item.trim());
                }
            }
        }

        if (updateData.sizes) {
            if (typeof updateData.sizes === 'string') {
                try {
                    updateData.sizes = JSON.parse(updateData.sizes);
                } catch (error) {
                    updateData.sizes = updateData.sizes.split(',').map(item => item.trim());
                }
            }
        }

        if (updateData.variants && Array.isArray(updateData.variants)) {
            const finalPrices = updateData.variants.map(v => Number(v.finalPrice) || 0).filter(p => p > 0);
            const discounts = updateData.variants.map(v => Number(v.discount) || 0).filter(p => p > 0);
            
            if (finalPrices.length > 0) {
                updateData.finalPrice = Math.min(...finalPrices);
                updateData.price = Math.min(...updateData.variants.map(v => Number(v.mrp) || 0).filter(p => p > 0));
            }
            if (discounts.length > 0) {
                updateData.discount = Math.max(...discounts);
            }
        }
        
        if (req.files) {
            if (req.files.images) {
                const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
                const uploadedImages = imageFiles.map(file => ({
                    file: {
                        path: file.location || getS3Url(file.key) || file.path,
                        relativePath: file.key || file.path
                    },
                    preview: file.location || getS3Url(file.key) || file.path,
                    name: file.originalname,
                    size: file.size
                }));
                
                updateData.images = uploadedImages;
                if (uploadedImages.length > 0) {
                    updateData.coverImage = uploadedImages[0].file.path;
                }
            }

            if (req.files.videos) {
                const videoFiles = Array.isArray(req.files.videos) ? req.files.videos : [req.files.videos];
                const uploadedVideos = videoFiles.map(file => file.location || getS3Url(file.key) || file.path);
                updateData.videos = uploadedVideos;
            }

            if (req.files.video) {
                const file = req.files.video;
                updateData.video = {
                    file: {
                        path: file.location || getS3Url(file.key) || file.path,
                        relativePath: file.key || file.path
                    },
                    preview: file.location || getS3Url(file.key) || file.path,
                    name: file.originalname,
                    size: file.size
                };
            }
        }

        if (updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0) {
            const processedImages = updateData.images.map(image => {
                let imagePath = image.file?.path || image.path;
                let relativePath = image.file?.relativePath || image.relativePath || imagePath;
                
                if (imagePath && imagePath.startsWith('./')) {
                    const filename = imagePath.replace('./', '');
                    imagePath = getS3ImageUrl(`products/${filename}`);
                    relativePath = `products/${filename}`;
                }
                
                let preview = image.preview;
                if (preview && preview.startsWith('blob:')) {
                    preview = imagePath;
                }
                
                return {
                    file: {
                        path: imagePath,
                        relativePath: relativePath
                    },
                    preview: preview,
                    name: image.name,
                    size: image.size
                };
            });
            
            updateData.images = processedImages;
            updateData.coverImage = processedImages[0].file.path;
        }

        if (updateData.title && !updateData.seoSlug) {
            updateData.seoSlug = updateData.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim('-');
        }

        if (updateData.title) updateData.title = updateData.title.trim();
        if (updateData.description) updateData.description = updateData.description.trim();
        if (updateData.brand) updateData.brand = updateData.brand.trim();

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
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this SEO slug already exists'
            });
        }

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

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

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
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

export const approveProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { status: 'approved' },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Product approved successfully',
            data: updatedProduct
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

export const rejectProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updateData = { status: 'rejected' };
        if (rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Product rejected successfully',
            data: updatedProduct
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

export const getProductsBySeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { page = 1, limit = 10, status } = req.query;

        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid seller ID'
            });
        }

        const filter = { 'creator.id': sellerId };
        if (status) {
            filter.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / Number(limit));

        res.status(200).json({
            success: true,
            message: 'Seller products retrieved successfully',
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
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};