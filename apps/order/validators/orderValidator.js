import Joi from 'joi';

export const createOrderFromCartSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName: Joi.string().required().trim().min(2).max(100),
    phone: Joi.string().required().pattern(/^(\+256|256|0)?[0-9]{9}$/),
    address: Joi.string().required().trim().min(10).max(200),
    city: Joi.string().required().trim().min(2).max(50),
    district: Joi.string().required().trim().min(2).max(50),
    postalCode: Joi.string().optional().trim().max(10),
    country: Joi.string().default('Uganda'),
    isDefault: Joi.boolean().default(false)
  }).required(),
  paymentDetails: Joi.object({
    method: Joi.string().valid('mtn_mobile_money', 'airtel_money', 'bank_transfer', 'cash_on_delivery').required(),
    phoneNumber: Joi.when('method', {
      is: Joi.string().valid('mtn_mobile_money', 'airtel_money'),
      then: Joi.string().required().pattern(/^(\+256|256|0)?[0-9]{9}$/),
      otherwise: Joi.string().optional()
    })
  }).required(),
  notes: Joi.string().optional().trim().max(500)
});

export const createDirectOrderSchema = Joi.object({
  productId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
  variantId: Joi.number().optional().integer().min(1),
  quantity: Joi.number().required().integer().min(1).max(100),
  shippingAddress: Joi.object({
    fullName: Joi.string().required().trim().min(2).max(100),
    phone: Joi.string().required().pattern(/^(\+256|256|0)?[0-9]{9}$/),
    address: Joi.string().required().trim().min(10).max(200),
    city: Joi.string().required().trim().min(2).max(50),
    district: Joi.string().required().trim().min(2).max(50),
    postalCode: Joi.string().optional().trim().max(10),
    country: Joi.string().default('Uganda'),
    isDefault: Joi.boolean().default(false)
  }).required(),
  paymentDetails: Joi.object({
    method: Joi.string().valid('mtn_mobile_money', 'airtel_money', 'bank_transfer', 'cash_on_delivery').required(),
    phoneNumber: Joi.when('method', {
      is: Joi.string().valid('mtn_mobile_money', 'airtel_money'),
      then: Joi.string().required().pattern(/^(\+256|256|0)?[0-9]{9}$/),
      otherwise: Joi.string().optional()
    })
  }).required(),
  notes: Joi.string().optional().trim().max(500)
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded').required(),
  notes: Joi.string().optional().trim().max(500)
});

export const updatePaymentStatusSchema = Joi.object({
  paymentStatus: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded').required(),
  transactionId: Joi.string().optional().trim().max(100)
});

export const cancelOrderSchema = Joi.object({
  reason: Joi.string().optional().trim().max(500)
});

export const initiatePaymentSchema = Joi.object({
  paymentMethod: Joi.string().valid('mtn_mobile_money', 'airtel_money', 'bank_transfer', 'cash_on_delivery').required(),
  phoneNumber: Joi.when('paymentMethod', {
    is: Joi.string().valid('mtn_mobile_money', 'airtel_money'),
    then: Joi.string().required().pattern(/^(\+256|256|0)?[0-9]{9}$/),
    otherwise: Joi.string().optional()
  })
});

export const webhookPaymentSchema = Joi.object({
  transactionId: Joi.string().required().trim().max(100),
  status: Joi.string().required().trim().max(50),
  orderId: Joi.string().optional().pattern(/^[0-9a-fA-F]{24}$/),
  amount: Joi.number().optional().positive(),
  currency: Joi.string().optional().trim().max(10)
});

export const getOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded').optional(),
  paymentStatus: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded').optional(),
  orderSource: Joi.string().valid('cart', 'direct_buy').optional()
});

export const validateOrderData = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }
    
    req.body = value;
    next();
  };
};

export const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: errorMessages
      });
    }
    
    req.query = value;
    next();
  };
};
