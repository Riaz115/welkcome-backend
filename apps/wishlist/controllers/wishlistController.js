import Wishlist from '../models/wishlistModel.js';
import Product from '../../Product/models/productModel.js';

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    let wishlist = await Wishlist.findOne({ userId })
      .populate('items.productId', 'title brand images coverImage variants price finalPrice discount visibility status');

    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
      await wishlist.save();
    }

    const filteredItems = wishlist.items.filter(item => 
      item.productId && 
      item.productId.visibility === 'public' && 
      item.productId.status === 'approved'
    );

    res.status(200).json({
      success: true,
      message: 'Wishlist retrieved successfully',
      data: {
        wishlist: {
          _id: wishlist._id,
          items: filteredItems,
          itemCount: filteredItems.length,
          lastUpdated: wishlist.lastUpdated
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve wishlist',
      error: error.message
    });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.visibility !== 'public' || product.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    if (wishlist.isItemInWishlist(productId, variantId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    let variantDetails = {};
    if (product.variantMode === 'multi' && product.variants && product.variants.length > 0) {
      if (variantId !== undefined && variantId !== null) {
        const variant = product.variants.find(v => v.id === variantId);
        if (variant) {
          variantDetails = {
            color: variant.variantCombination?.Color || null,
            size: variant.variantCombination?.Size || null,
            sku: variant.sku || ''
          };
        }
      }
    }

    wishlist.addItem(productId, variantId, variantDetails);
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist successfully',
      data: {
        wishlist: {
          _id: wishlist._id,
          items: wishlist.items,
          itemCount: wishlist.itemCount,
          lastUpdated: wishlist.lastUpdated
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
      error: error.message
    });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    const initialLength = wishlist.items.length;
    wishlist.removeItem(productId, variantId);

    if (wishlist.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist successfully',
      data: {
        wishlist: {
          _id: wishlist._id,
          items: wishlist.items,
          itemCount: wishlist.itemCount,
          lastUpdated: wishlist.lastUpdated
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist',
      error: error.message
    });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    wishlist.clearWishlist();
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully',
      data: {
        wishlist: {
          _id: wishlist._id,
          items: wishlist.items,
          itemCount: wishlist.itemCount,
          lastUpdated: wishlist.lastUpdated
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist',
      error: error.message
    });
  }
};

export const checkWishlistStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const wishlist = await Wishlist.findOne({ userId });
    const isInWishlist = wishlist ? wishlist.isItemInWishlist(productId, variantId) : false;

    res.status(200).json({
      success: true,
      message: 'Wishlist status retrieved successfully',
      data: {
        isInWishlist,
        productId,
        variantId: variantId || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist status',
      error: error.message
    });
  }
};

export const moveToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    if (!wishlist.isItemInWishlist(productId, variantId)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.visibility !== 'public' || product.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    let price, discountedPrice;

    if (product.variantMode === 'multi' && product.variants && product.variants.length > 0) {
      if (variantId !== undefined && variantId !== null) {
        const variant = product.variants.find(v => v.id === variantId);
        if (!variant) {
          return res.status(404).json({
            success: false,
            message: 'Product variant not found'
          });
        }

        if (parseInt(variant.stock) < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock available'
          });
        }

        price = parseFloat(variant.mrp);
        discountedPrice = parseFloat(variant.finalPrice);
      }
    } else {
      price = product.price || 0;
      discountedPrice = product.finalPrice || product.price || 0;
    }

    const Cart = (await import('../../cart/models/cartModel.js')).default;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId && 
      item.variantId === variantId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice = cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].discountedPrice;
    } else {
      let variantDetails = {};
      if (product.variantMode === 'multi' && variantId !== null) {
        const variant = product.variants.find(v => v.id === variantId);
        if (variant) {
          variantDetails = {
            color: variant.variantCombination?.Color || null,
            size: variant.variantCombination?.Size || null,
            sku: variant.sku || ''
          };
        }
      }

      cart.items.push({
        productId,
        variantId: variantId || null,
        quantity,
        price,
        discountedPrice,
        totalPrice: quantity * discountedPrice,
        variantDetails
      });
    }

    await cart.save();

    wishlist.removeItem(productId, variantId);
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product moved to cart successfully',
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          subtotal: cart.subtotal,
          totalAmount: cart.totalAmount,
          itemCount: cart.itemCount
        },
        wishlist: {
          _id: wishlist._id,
          items: wishlist.items,
          itemCount: wishlist.itemCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to move product to cart',
      error: error.message
    });
  }
};
