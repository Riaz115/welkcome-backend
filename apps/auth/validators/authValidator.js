import jwt from "jsonwebtoken";
import User from "../../user/models/userModel.js";
import Seller from "../../seller/models/Seller.js";

export const isLoggedIn = async (req, res, next) => {
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
    } else if (decoded.role === 'user') {
      const user = await User.findById(decoded.userId).select("-password");
      if (!user || user.token !== token) {
        return res.status(401).json({
          success: false,
          message: 'User not found or invalid token'
        });
      }
      
      req.user = user;
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

//not confirmed yet
