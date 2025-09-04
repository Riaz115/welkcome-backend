import Joi from 'joi';

export const parseFormData = (req, res, next) => {
  const parsedBody = {};
  
  Object.keys(req.body).forEach(key => {
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = parsedBody;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = req.body[key];
    } else if (key.includes('[') && key.includes(']')) {
      const arrayName = key.split('[')[0];
      const index = parseInt(key.match(/\[(\d+)\]/)[1]);
      
      if (!parsedBody[arrayName]) {
        parsedBody[arrayName] = [];
      }
      parsedBody[arrayName][index] = req.body[key];
    } else {
      parsedBody[key] = req.body[key];
    }
  });
  
  req.body = parsedBody;
  next();
};

export const validateBecomeSeller = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().trim(),
    phone: Joi.string().required().trim(),
    password: Joi.string().min(6).required(),
    businessName: Joi.string().required().trim(),
    businessType: Joi.string().required().trim(),
    businessRegistrationNumber: Joi.string().required().trim(),
    tinNumber: Joi.string().optional().trim(),
    businessAddress: Joi.object({
      district: Joi.string().optional().trim(),
      subCounty: Joi.string().optional().trim(),
      village: Joi.string().optional().trim(),
      street: Joi.string().optional().trim(),
      postalCode: Joi.string().optional().trim()
    }).optional(),
    contactPerson: Joi.object({
      name: Joi.string().optional().trim(),
      phone: Joi.string().optional().trim(),
      email: Joi.string().optional().trim()
    }).optional(),
    bankDetails: Joi.object({
      bankName: Joi.string().optional().trim(),
      accountNumber: Joi.string().optional().trim(),
      accountName: Joi.string().optional().trim(),
      swiftCode: Joi.string().optional().trim()
    }).optional(),
    businessDescription: Joi.string().optional().trim(),
    businessEmail: Joi.string().optional().trim(),
    website: Joi.string().optional().trim(),
    socialMedia: Joi.object({
      facebook: Joi.string().optional().trim(),
      instagram: Joi.string().optional().trim(),
      twitter: Joi.string().optional().trim(),
      linkedin: Joi.string().optional().trim()
    }).optional(),
    paymentMethods: Joi.array().items(Joi.string()).optional(),
    deliveryOptions: Joi.array().items(Joi.string()).optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  next();
};

export const validateUpdateSeller = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().optional().trim(),
    email: Joi.string().email().optional().trim(),
    phone: Joi.string().optional().trim(),
    password: Joi.string().min(6).optional(),
    businessName: Joi.string().optional().trim(),
    businessType: Joi.string().optional().trim(),
    tinNumber: Joi.string().optional().trim(),
    businessAddress: Joi.object({
      district: Joi.string().optional().trim(),
      subCounty: Joi.string().optional().trim(),
      village: Joi.string().optional().trim(),
      street: Joi.string().optional().trim(),
      postalCode: Joi.string().optional().trim()
    }).optional(),
    contactPerson: Joi.object({
      name: Joi.string().optional().trim(),
      phone: Joi.string().optional().trim(),
      email: Joi.string().optional().trim()
    }).optional(),
    bankDetails: Joi.object({
      bankName: Joi.string().optional().trim(),
      accountNumber: Joi.string().optional().trim(),
      accountName: Joi.string().optional().trim(),
      swiftCode: Joi.string().optional().trim()
    }).optional(),
    businessDescription: Joi.string().optional().trim(),
    businessEmail: Joi.string().optional().trim(),
    website: Joi.string().optional().trim(),
    socialMedia: Joi.object({
      facebook: Joi.string().optional().trim(),
      instagram: Joi.string().optional().trim(),
      twitter: Joi.string().optional().trim(),
      linkedin: Joi.string().optional().trim()
    }).optional(),
    paymentMethods: Joi.array().items(Joi.string()).optional(),
    deliveryOptions: Joi.array().items(Joi.string()).optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  next();
};

export const validateVerifySeller = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().required(),
    rejectionReason: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  next();
};