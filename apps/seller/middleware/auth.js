import jwt from 'jsonwebtoken';
import Seller from '../models/Seller.js';

// Verify JWT token
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
    
    // Get seller from database
    const seller = await Seller.findById(decoded.id);
    if (!seller || !seller.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or seller account deactivated.'
      });
    }

    req.seller = seller;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Check if user is admin
export const requireAdmin = (req, res, next) => {
  if (req.seller.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if user can access the resource (own profile or admin)
export const checkResourceAccess = (req, res, next) => {
  const requestedId = req.params.id;
  
  // Admin can access any resource
  if (req.seller.role === 'admin') {
    return next();
  }
  
  // Seller can only access their own resources
  if (req.seller._id.toString() !== requestedId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }
  
  next();
};

// Generate JWT token
export const generateToken = (sellerId) => {
  return jwt.sign(
    { id: sellerId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}; 