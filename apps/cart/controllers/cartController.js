import Cart from '../models/cartModel.js';
import Product from '../../Product/models/productModel.js';
import Coupon from '../../coupon/models/couponModel.js';
import User from '../../user/models/userModel.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId })
      .populate('items.productId', 'title brand images coverImage variants')
      .populate('appliedCoupon');

    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          appliedCoupon: cart.appliedCoupon,
          subtotal: cart.subtotal,
          discountAmount: cart.discountAmount,
          totalAmount: cart.totalAmount,
          itemCount: cart.itemCount,
          lastUpdated: cart.lastUpdated
        }
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error.message
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, quantity = 1 } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Determine price and variant details
    let price, discountedPrice, variantDetails = {};

    if (product.variantMode === 'multi' && product.variants && product.variants.length > 0) {
      // Multi-variant product
      if (variantId === undefined || variantId === null) {
        return res.status(400).json({
          success: false,
          message: 'Variant ID is required for this product'
        });
      }

      const variant = product.variants.find(v => v.id === variantId);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Product variant not found'
        });
      }

      // Check stock
      if (parseInt(variant.stock) < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock available'
        });
      }

      price = parseFloat(variant.mrp);
      discountedPrice = parseFloat(variant.finalPrice);
      variantDetails = {
        color: variant.variantCombination?.Color || null,
        size: variant.variantCombination?.Size || null,
        sku: variant.sku || ''
      };
    } else {
      // Single variant product
      price = product.price || 0;
      discountedPrice = product.finalPrice || product.price || 0;
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId && 
      item.variantId === variantId
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Check stock again for updated quantity
      if (product.variantMode === 'multi') {
        const variant = product.variants.find(v => v.id === variantId);
        if (parseInt(variant.stock) < newQuantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock available for requested quantity'
          });
        }
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].totalPrice = newQuantity * discountedPrice;
    } else {
      // Add new item
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

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          appliedCoupon: cart.appliedCoupon,
          subtotal: cart.subtotal,
          discountAmount: cart.discountAmount,
          totalAmount: cart.totalAmount,
          itemCount: cart.itemCount
        }
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// Update item quantity in cart
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId && 
      item.variantId === variantId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Check stock availability
    const product = await Product.findById(productId);
    if (product && product.variantMode === 'multi' && variantId !== null) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant && parseInt(variant.stock) < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock available'
        });
      }
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalPrice = quantity * cart.items[itemIndex].discountedPrice;

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          appliedCoupon: cart.appliedCoupon,
          subtotal: cart.subtotal,
          discountAmount: cart.discountAmount,
          totalAmount: cart.totalAmount,
          itemCount: cart.itemCount
        }
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => 
      !(item.productId.toString() === productId && item.variantId === variantId)
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          appliedCoupon: cart.appliedCoupon,
          subtotal: cart.subtotal,
          discountAmount: cart.discountAmount,
          totalAmount: cart.totalAmount,
          itemCount: cart.itemCount
        }
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.clearCart();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          appliedCoupon: cart.appliedCoupon,
          subtotal: cart.subtotal,
          discountAmount: cart.discountAmount,
          totalAmount: cart.totalAmount,
          itemCount: cart.itemCount
        }
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

// Apply coupon to cart
export const applyCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Find coupon
    const coupon = await Coupon.findByCode(couponCode);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Validate coupon for this order
    const validation = coupon.validateForOrder(cart.subtotal, userId);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0]
      });
    }

    // Apply coupon
    cart.applyCoupon(coupon);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          appliedCoupon: cart.appliedCoupon,
          subtotal: cart.subtotal,
          discountAmount: cart.discountAmount,
          totalAmount: cart.totalAmount,
          itemCount: cart.itemCount
        },
        coupon: {
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: cart.discountAmount
        }
      }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply coupon',
      error: error.message
    });
  }
};

// Remove coupon from cart
export const removeCoupon = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    if (!cart.appliedCoupon) {
      return res.status(400).json({
        success: false,
        message: 'No coupon applied to cart'
      });
    }

    cart.removeCoupon();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Coupon removed successfully',
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          appliedCoupon: cart.appliedCoupon,
          subtotal: cart.subtotal,
          discountAmount: cart.discountAmount,
          totalAmount: cart.totalAmount,
          itemCount: cart.itemCount
        }
      }
    });
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove coupon',
      error: error.message
    });
  }
};
