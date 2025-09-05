import jwt from 'jsonwebtoken';
import User from '../../user/models/userModel.js';
import Seller from '../models/Seller.js';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'admin') {
      const user = await User.findById(decoded.userId);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Admin not found'
        });
      }
      
      req.user = {
        _id: user._id,
        role: 'admin',
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };
    } else if (decoded.role === 'seller') {
      const seller = await Seller.findById(decoded.userId);
      if (!seller) {
        return res.status(401).json({
          success: false,
          message: 'Seller not found'
        });
      }
      
      req.user = {
        _id: seller._id,
        role: 'seller',
        email: seller.email,
        name: seller.name,
        verificationStatus: seller.verificationStatus
      };
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

export const requireSeller = (req, res, next) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Seller role required.'
    });
  }
  
  if (req.user.verificationStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Seller account not approved.'
    });
  }
  next();
};

export const requireAdminOrSeller = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'seller') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Seller role required.'
    });
  }
  
  // Allow both pending and approved sellers to create products
  if (req.user.role === 'seller' && req.user.verificationStatus === 'rejected') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Seller account has been rejected.'
    });
  }
  next();
};