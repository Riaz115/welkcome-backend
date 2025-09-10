import Product from '../models/productModel.js';
import mongoose from 'mongoose';

export const advancedProductSearch = async (req, res) => {
  try {
    const {
      query,
      primeCategory,
      category,
      subcategory,
      primeCategoryId,
      categoryId,
      subcategoryId,
      minPrice,
      maxPrice,
      priceRange,
      minDiscount,
      maxDiscount,
      discountType,
      discountValue,
      color,
      size,
      model,
      variantType,
      variantValue,
      brand,
      brandId,
      sku,
      inStock,
      outOfStock,
      tags,
      weight,
      productCollection,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      visibility = 'public',
      status = 'approved',
      dateFrom,
      dateTo,
      colors,
      sizes,
      models,
      brands,
      primeCategories,
      categories,
      subcategories
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;

    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { tags: searchRegex },
        { 'variants.name': searchRegex },
        { 'variants.variantValue': searchRegex },
        { 'variants.sku': searchRegex },
        { 'legacyVariants.value': searchRegex },
        { modelValues: searchRegex },
        { customVariantValues: searchRegex },
        { colorValues: searchRegex },
        { sizes: searchRegex },
        { 'variants.color': searchRegex },
        { 'variants.size': searchRegex },
        { 'variants.model': searchRegex }
      ];
    }

    if (primeCategory) filter.primeCategory = new RegExp(primeCategory, 'i');
    if (category) filter.category = new RegExp(category, 'i');
    if (subcategory) filter.subcategory = new RegExp(subcategory, 'i');
    
    if (primeCategoryId) filter.primeCategoryId = primeCategoryId;
    if (categoryId) filter.categoryId = categoryId;
    if (subcategoryId) filter.subcategoryId = subcategoryId;

    if (primeCategories) {
      const primeCatArray = primeCategories.split(',').map(cat => new RegExp(cat.trim(), 'i'));
      filter.primeCategory = { $in: primeCatArray };
    }
    if (categories) {
      const catArray = categories.split(',').map(cat => new RegExp(cat.trim(), 'i'));
      filter.category = { $in: catArray };
    }
    if (subcategories) {
      const subcatArray = subcategories.split(',').map(cat => new RegExp(cat.trim(), 'i'));
      filter.subcategory = { $in: subcatArray };
    }

    if (brand) filter.brand = new RegExp(brand, 'i');
    if (brandId) filter.brandId = brandId;
    if (brands) {
      const brandArray = brands.split(',').map(b => new RegExp(b.trim(), 'i'));
      filter.brand = { $in: brandArray };
    }

    if (sku) {
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { sku: new RegExp(sku, 'i') },
        { 'variants.sku': new RegExp(sku, 'i') }
      );
    }

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { finalPrice: priceFilter },
        { 'variants.finalPrice': priceFilter }
      );
    }

    if (priceRange) {
      const ranges = {
        'under-100': { $lt: 100 },
        '100-500': { $gte: 100, $lte: 500 },
        '500-1000': { $gte: 500, $lte: 1000 },
        '1000-5000': { $gte: 1000, $lte: 5000 },
        'above-5000': { $gt: 5000 }
      };
      
      if (ranges[priceRange]) {
        if (!filter.$or) filter.$or = [];
        filter.$or.push(
          { finalPrice: ranges[priceRange] },
          { 'variants.finalPrice': ranges[priceRange] }
        );
      }
    }

    if (minDiscount || maxDiscount) {
      const discountFilter = {};
      if (minDiscount) discountFilter.$gte = Number(minDiscount);
      if (maxDiscount) discountFilter.$lte = Number(maxDiscount);
      
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { discount: discountFilter },
        { 'variants.discount': discountFilter }
      );
    }

    if (discountValue) {
      const discountNum = Number(discountValue);
      if (discountType === 'percentage') {
        if (!filter.$or) filter.$or = [];
        filter.$or.push(
          { discount: { $gte: discountNum } },
          { 'variants.discount': { $gte: discountNum } }
        );
      } else if (discountType === 'flat') {
        if (!filter.$or) filter.$or = [];
        filter.$or.push(
          { 
            $expr: {
              $gte: [
                { $multiply: [{ $divide: ['$discount', '$price'] }, 100] },
                discountNum
              ]
            }
          }
        );
      }
    }

    if (color) {
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { color: new RegExp(color, 'i') },
        { colorValues: new RegExp(color, 'i') },
        { 'variants.variantValue': new RegExp(color, 'i') },
        { 'variants.variantCombination.Color': new RegExp(color, 'i') },
        { 'variants.color': new RegExp(color, 'i') }
      );
    }

    if (size) {
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { sizes: new RegExp(size, 'i') },
        { 'variants.size': new RegExp(size, 'i') },
        { 'variants.variantCombination.Size': new RegExp(size, 'i') }
      );
    }

    if (model) {
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { modelValues: new RegExp(model, 'i') },
        { 'variants.variantValue': new RegExp(model, 'i') },
        { customVariantValues: new RegExp(model, 'i') },
        { 'variants.model': new RegExp(model, 'i') }
      );
    }

    if (colors) {
      const colorArray = colors.split(',').map(c => new RegExp(c.trim(), 'i'));
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { colorValues: { $in: colorArray } },
        { 'variants.variantValue': { $in: colorArray } },
        { 'variants.variantCombination.Color': { $in: colorArray } },
        { 'variants.color': { $in: colorArray } }
      );
    }

    if (sizes) {
      const sizeArray = sizes.split(',').map(s => new RegExp(s.trim(), 'i'));
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { sizes: { $in: sizeArray } },
        { 'variants.size': { $in: sizeArray } },
        { 'variants.variantCombination.Size': { $in: sizeArray } }
      );
    }

    if (models) {
      const modelArray = models.split(',').map(m => new RegExp(m.trim(), 'i'));
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { modelValues: { $in: modelArray } },
        { 'variants.variantValue': { $in: modelArray } },
        { customVariantValues: { $in: modelArray } },
        { 'variants.model': { $in: modelArray } }
      );
    }

    if (inStock === 'true') {
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { 'variants.stock': { $gt: 0 } },
        { 'variants.stock': { $regex: /^[1-9]/ } }
      );
    }

    if (outOfStock === 'true') {
      if (!filter.$or) filter.$or = [];
      filter.$or.push(
        { 'variants.stock': 0 },
        { 'variants.stock': '0' },
        { 'variants.stock': { $regex: /^0/ } }
      );
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    if (weight) filter.weight = new RegExp(weight, 'i');
    if (productCollection) filter.productCollection = new RegExp(productCollection, 'i');

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (filter.$or && filter.$or.length > 0) {
      const allOrConditions = [];
      const existingOr = filter.$or;
      delete filter.$or;
      allOrConditions.push(...existingOr);
      if (allOrConditions.length > 0) {
        filter.$or = allOrConditions;
      }
    }

    const sort = {};
    if (sortBy === 'price') {
      sort.finalPrice = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'discount') {
      sort.discount = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'title') {
      sort.title = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / Number(limit));

    const searchSuggestions = await getSearchSuggestions(filter, query);
    const availableFilters = await getAvailableFilters(filter);

    res.status(200).json({
      success: true,
      message: 'Products found successfully',
      data: {
        products,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalProducts,
          hasNextPage: Number(page) < totalPages,
          hasPrevPage: Number(page) > 1,
          limit: Number(limit)
        },
        searchSuggestions,
        availableFilters,
        appliedFilters: {
          query,
          primeCategory,
          category,
          subcategory,
          minPrice,
          maxPrice,
          color,
          size,
          model,
          brand,
          tags
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
};

const getSearchSuggestions = async (filter, query) => {
  try {
    const suggestions = {
      brands: [],
      categories: [],
      colors: [],
      sizes: [],
      priceRanges: []
    };

    const brandAggregation = await Product.aggregate([
      { $match: filter },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    suggestions.brands = brandAggregation.map(item => ({
      name: item._id,
      count: item.count
    }));

    const categoryAggregation = await Product.aggregate([
      { $match: filter },
      { $group: { _id: { prime: '$primeCategory', category: '$category' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    suggestions.categories = categoryAggregation.map(item => ({
      primeCategory: item._id.prime,
      category: item._id.category,
      count: item.count
    }));

    const colorAggregation = await Product.aggregate([
      { $match: filter },
      { $unwind: '$variants' },
      { $group: { _id: '$variants.variantValue', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null, $ne: '' } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);
    suggestions.colors = colorAggregation.map(item => ({
      name: item._id,
      count: item.count
    }));

    const sizeAggregation = await Product.aggregate([
      { $match: filter },
      { $unwind: '$variants' },
      { $group: { _id: '$variants.size', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null, $ne: '' } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);
    suggestions.sizes = sizeAggregation.map(item => ({
      name: item._id,
      count: item.count
    }));

    return suggestions;
  } catch (error) {
    return {
      brands: [],
      categories: [],
      colors: [],
      sizes: [],
      priceRanges: []
    };
  }
};

const getAvailableFilters = async (filter) => {
  try {
    const filters = {
      priceRange: {
        min: 0,
        max: 0,
        ranges: []
      },
      discountRange: {
        min: 0,
        max: 0
      },
      brands: [],
      categories: [],
      colors: [],
      sizes: []
    };

    const priceStats = await Product.aggregate([
      { $match: filter },
      { $unwind: '$variants' },
      {
        $group: {
          _id: null,
          minPrice: { $min: { $toDouble: '$variants.finalPrice' } },
          maxPrice: { $max: { $toDouble: '$variants.finalPrice' } }
        }
      }
    ]);

    if (priceStats.length > 0) {
      filters.priceRange.min = Math.floor(priceStats[0].minPrice || 0);
      filters.priceRange.max = Math.ceil(priceStats[0].maxPrice || 0);
    }

    const discountStats = await Product.aggregate([
      { $match: filter },
      { $unwind: '$variants' },
      {
        $group: {
          _id: null,
          minDiscount: { $min: { $toDouble: '$variants.discount' } },
          maxDiscount: { $max: { $toDouble: '$variants.discount' } }
        }
      }
    ]);

    if (discountStats.length > 0) {
      filters.discountRange.min = Math.floor(discountStats[0].minDiscount || 0);
      filters.discountRange.max = Math.ceil(discountStats[0].maxDiscount || 0);
    }

    return filters;
  } catch (error) {
    return {
      priceRange: { min: 0, max: 0, ranges: [] },
      discountRange: { min: 0, max: 0 },
      brands: [],
      categories: [],
      colors: [],
      sizes: []
    };
  }
};

export const quickSearch = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(query, 'i');
    const filter = {
      status: 'approved',
      visibility: 'public',
      $or: [
        { title: searchRegex },
        { brand: searchRegex },
        { 'variants.name': searchRegex },
        { 'variants.variantValue': searchRegex },
        { tags: searchRegex },
        { colorValues: searchRegex },
        { sizes: searchRegex },
        { 'variants.color': searchRegex },
        { 'variants.size': searchRegex },
        { 'variants.model': searchRegex }
      ]
    };

    const products = await Product.find(filter)
      .select('title brand primeCategory category subcategory finalPrice coverImage variants')
      .limit(Number(limit))
      .lean();

    const suggestions = products.map(product => ({
      id: product._id,
      title: product.title,
      brand: product.brand,
      category: `${product.primeCategory} > ${product.category}`,
      price: product.finalPrice,
      image: product.coverImage,
      variants: product.variants?.slice(0, 3) || []
    }));

    res.status(200).json({
      success: true,
      message: 'Quick search completed',
      data: {
        suggestions,
        total: suggestions.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Quick search failed',
      error: error.message
    });
  }
};

export const searchBySku = async (req, res) => {
  try {
    const { sku, exact = false } = req.query;

    if (!sku) {
      return res.status(400).json({
        success: false,
        message: 'SKU is required'
      });
    }

    const filter = {
      status: 'approved',
      visibility: 'public'
    };

    if (exact === 'true') {
      filter.$or = [
        { sku: sku },
        { 'variants.sku': sku }
      ];
    } else {
      const skuRegex = new RegExp(sku, 'i');
      filter.$or = [
        { sku: skuRegex },
        { 'variants.sku': skuRegex }
      ];
    }

    const products = await Product.find(filter).lean();

    res.status(200).json({
      success: true,
      message: 'SKU search completed',
      data: {
        products,
        total: products.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'SKU search failed',
      error: error.message
    });
  }
};

export const getSearchAnalytics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    const analytics = await Product.aggregate([
      { $match: { status: 'approved', visibility: 'public', ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }) } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalVariants: { $sum: { $size: '$variants' } },
          avgPrice: { $avg: '$finalPrice' },
          minPrice: { $min: '$finalPrice' },
          maxPrice: { $max: '$finalPrice' },
          totalBrands: { $addToSet: '$brand' },
          totalCategories: { $addToSet: { prime: '$primeCategory', category: '$category' } }
        }
      },
      {
        $project: {
          totalProducts: 1,
          totalVariants: 1,
          avgPrice: { $round: ['$avgPrice', 2] },
          minPrice: 1,
          maxPrice: 1,
          uniqueBrands: { $size: '$totalBrands' },
          uniqueCategories: { $size: '$totalCategories' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Search analytics retrieved',
      data: analytics[0] || {
        totalProducts: 0,
        totalVariants: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        uniqueBrands: 0,
        uniqueCategories: 0
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get search analytics',
      error: error.message
    });
  }
};
