import Order from '../models/orderModel.js';
import Cart from '../../cart/models/cartModel.js';
import Product from '../../Product/models/productModel.js';
import User from '../../user/models/userModel.js';
import mongoose from 'mongoose';

export const createOrderFromCart = async (req, res) => {
  try {
    const { shippingAddress, paymentDetails, notes = '' } = req.body;
    const userId = req.user.id;

    if (!shippingAddress || !paymentDetails) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address and payment details are required'
      });
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const orderItems = cart.items.map(item => ({
      productId: item.productId._id,
      variantId: item.variantId,
      productName: item.productId.title,
      productImage: item.productId.coverImage || (item.productId.images && item.productId.images[0]?.preview) || '',
      variantDetails: item.variantDetails,
      quantity: item.quantity,
      unitPrice: item.discountedPrice,
      totalPrice: item.totalPrice
    }));

    const order = new Order({
      userId,
      items: orderItems,
      shippingAddress,
      paymentDetails: {
        ...paymentDetails,
        amount: cart.totalAmount
      },
      appliedCoupon: cart.appliedCoupon || null,
      pricing: {
        subtotal: cart.subtotal,
        shippingCost: 0,
        discountAmount: cart.discountAmount,
        taxAmount: 0,
        totalAmount: cart.totalAmount
      },
      orderSource: 'cart',
      notes
    });

    await order.save();

    await cart.clearCart();
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

export const createDirectOrder = async (req, res) => {
  try {
    const { productId, variantId, quantity, shippingAddress, paymentDetails, notes = '' } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity || !shippingAddress || !paymentDetails) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, quantity, shipping address and payment details are required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let unitPrice = product.finalPrice || product.price;
    let variantDetails = {};

    if (variantId && product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        unitPrice = parseFloat(variant.finalPrice);
        variantDetails = {
          color: variant.variantCombination?.Color || null,
          size: variant.variantCombination?.Size || null,
          sku: variant.sku || ''
        };
      }
    }

    const totalPrice = unitPrice * quantity;

    const order = new Order({
      userId,
      items: [{
        productId: product._id,
        variantId: variantId || null,
        productName: product.title,
        productImage: product.coverImage || (product.images && product.images[0]?.preview) || '',
        variantDetails,
        quantity,
        unitPrice,
        totalPrice
      }],
      shippingAddress,
      paymentDetails: {
        ...paymentDetails,
        amount: totalPrice
      },
      pricing: {
        subtotal: totalPrice,
        shippingCost: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: totalPrice
      },
      orderSource: 'direct_buy',
      notes
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.productId', 'title coverImage images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.productId', 'title coverImage images description')
      .populate('userId', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes = '' } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.updateStatus(status, notes);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, transactionId = '' } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.updatePaymentStatus(paymentStatus, transactionId);

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = '' } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this order'
      });
    }

    await order.updateStatus('cancelled', reason);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, orderSource } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query['paymentDetails.paymentStatus'] = paymentStatus;
    if (orderSource) query.orderSource = orderSource;

    const orders = await Order.find(query)
      .populate('items.productId', 'title coverImage')
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const paymentStats = await Order.aggregate([
      {
        $group: {
          _id: '$paymentDetails.paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0
        },
        statusBreakdown: statusStats,
        paymentBreakdown: paymentStats
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order stats',
      error: error.message
    });
  }
};
