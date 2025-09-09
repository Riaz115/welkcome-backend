import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantId: {
    type: Number,
    default: null
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    default: ''
  },
  variantDetails: {
    color: { type: String, default: null },
    size: { type: String, default: null },
    sku: { type: String, default: '' }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'Uganda'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const paymentDetailsSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['mtn_mobile_money', 'airtel_money', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  phoneNumber: {
    type: String,
    required: function() {
      return ['mtn_mobile_money', 'airtel_money'].includes(this.method);
    }
  },
  transactionId: {
    type: String,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: null
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'UGX'
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentDetails: paymentDetailsSchema,
  appliedCoupon: {
    couponCode: { type: String, default: null },
    discountType: { type: String, default: null },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 }
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    shippingCost: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  orderSource: {
    type: String,
    enum: ['cart', 'direct_buy'],
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  estimatedDelivery: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

orderSchema.index({ userId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentDetails.paymentStatus': 1 });

orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    this.cancellationReason = notes;
  }
  return this.save();
};

orderSchema.methods.updatePaymentStatus = function(status, transactionId = '') {
  this.paymentDetails.paymentStatus = status;
  if (status === 'completed') {
    this.paymentDetails.paymentDate = new Date();
    this.paymentDetails.transactionId = transactionId;
    this.status = 'confirmed';
  } else if (status === 'failed') {
    this.status = 'cancelled';
    this.cancellationReason = 'Payment failed';
    this.cancelledAt = new Date();
  }
  return this.save();
};

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
