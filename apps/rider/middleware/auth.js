import jwt from 'jsonwebtoken';
import Rider from '../models/Rider.js';

// Verify JWT token for riders
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
    
    // Get rider from database
    const rider = await Rider.findById(decoded.id);
    if (!rider || !rider.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or rider account deactivated.'
      });
    }

    req.rider = rider;
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
  if (req.rider.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if rider can access the resource (own profile or admin)
export const checkResourceAccess = (req, res, next) => {
  const requestedId = req.params.id;
  
  // Admin can access any resource
  if (req.rider.role === 'admin') {
    return next();
  }
  
  // Rider can only access their own resources
  if (req.rider._id.toString() !== requestedId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }
  
  next();
};

// Check if rider is verified (for certain operations)
export const requireVerified = (req, res, next) => {
  if (req.rider.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Account verification required.'
    });
  }
  next();
};

// Generate JWT token for riders
export const generateToken = (riderId) => {
  return jwt.sign(
    { id: riderId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}; 