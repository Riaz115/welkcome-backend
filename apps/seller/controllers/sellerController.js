import Seller from "../models/Seller.js";
import { deleteFile } from "../middleware/upload.js";
import bcrypt from 'bcryptjs';

export const becomeSeller = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      businessName,
      businessType,
      businessRegistrationNumber,
      businessAddress,
      contactPerson,
      bankDetails,
      businessEmail,
      businessDescription,
      website,
      socialMedia,
      paymentMethods,
      deliveryOptions,
      tinNumber
    } = req.body;

    const existingSeller = await Seller.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { businessRegistrationNumber: businessRegistrationNumber.trim() }
      ]
    });

    if (existingSeller) {
      if (req.files) {
        Object.values(req.files).flat().forEach((file) => {
          if (file.key) {
            deleteFile(file.key);
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: "Seller with this email or business registration number already exists",
        details: {
          existingEmail: existingSeller.email,
          existingBusinessRegistrationNumber: existingSeller.businessRegistrationNumber
        }
      });
    }

    const parsedBusinessAddress = businessAddress ? (typeof businessAddress === "string" 
      ? JSON.parse(businessAddress) 
      : businessAddress) : {};
    const parsedContactPerson = contactPerson ? (typeof contactPerson === "string" 
      ? JSON.parse(contactPerson) 
      : contactPerson) : {};
    const parsedBankDetails = bankDetails ? (typeof bankDetails === "string" 
      ? JSON.parse(bankDetails) 
      : bankDetails) : {};
    const parsedSocialMedia = socialMedia ? (typeof socialMedia === "string" 
      ? JSON.parse(socialMedia) 
      : socialMedia) : {};
    const parsedPaymentMethods = paymentMethods ? (typeof paymentMethods === "string" 
      ? JSON.parse(paymentMethods) 
      : paymentMethods) : [];
    const parsedDeliveryOptions = deliveryOptions ? (typeof deliveryOptions === "string" 
      ? JSON.parse(deliveryOptions) 
      : deliveryOptions) : [];

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const sellerData = {
      name,
      email,
      phone,
      password: hashedPassword,
      businessName,
      businessType,
      businessRegistrationNumber,
      businessAddress: parsedBusinessAddress,
      contactPerson: parsedContactPerson,
      bankDetails: parsedBankDetails,
      businessEmail,
      businessDescription,
      website,
      socialMedia: parsedSocialMedia,
      paymentMethods: parsedPaymentMethods,
      deliveryOptions: parsedDeliveryOptions,
      verificationStatus: 'pending'
    };

    if (req.files) {
      sellerData.documents = {};
      const documentTypes = [
        'businessRegistrationCertificate', 
        'bankStatement', 
        'idProof',
        'tradingLicense'
      ];
      
      documentTypes.forEach(docType => {
        if (req.files[docType]) {
          sellerData.documents[docType] = {
            filename: req.files[docType][0].originalname,
            path: req.files[docType][0].location,
            key: req.files[docType][0].key
          };
        }
      });
    }

    const seller = new Seller(sellerData);
    
    try {
      await seller.save();
    } catch (saveError) {
      if (req.files) {
        Object.values(req.files).flat().forEach((file) => {
          if (file.key) {
            deleteFile(file.key);
          }
        });
      }
      
      if (saveError.code === 11000) {
        const field = Object.keys(saveError.keyValue)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
          details: {
            field: field,
            value: saveError.keyValue[field]
          }
        });
      }
      
      throw saveError;
    }

    res.status(201).json({
      success: true,
      message: "Seller application submitted successfully. Your application is pending approval.",
      data: seller.getPublicProfile()
    });
  } catch (error) {
    if (req.files) {
      Object.values(req.files).flat().forEach((file) => {
        if (file.key) {
          deleteFile(file.key);
        }
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      if (field === 'tinNumber') {
        return res.status(400).json({
          success: false,
          message: "Seller with this email or business registration number already exists"
        });
      }
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
        details: {
          field: field,
          value: error.keyValue[field]
        }
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error during seller application"
    });
  }
};

export const getAllSellers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, district, businessType } = req.query;
    const query = {};

    if (status) {
      query.verificationStatus = status;
    }

    if (district) {
      query['businessAddress.district'] = { $regex: district, $options: 'i' };
    }

    if (businessType) {
      query.businessType = businessType;
    }

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessRegistrationNumber: { $regex: search, $options: 'i' } },
        { 'contactPerson.name': { $regex: search, $options: 'i' } }
      ];
    }

    const sellers = await Seller.find(query)
      .populate('verifiedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Seller.countDocuments(query);

    const sellersWithDocs = sellers.map(seller => {
      const sellerObj = seller.toObject();
      delete sellerObj.password;
      delete sellerObj.rejectionReason;
      return sellerObj;
    });

    res.json({
      success: true,
      data: {
        sellers: sellersWithDocs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSellers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Get all sellers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sellers"
    });
  }
};

export const getSellerById = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await Seller.findById(id)
      .populate('verifiedBy', 'firstName lastName')
;

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    const sellerObj = seller.toObject();
    delete sellerObj.password;
    delete sellerObj.rejectionReason;

    res.json({
      success: true,
      data: sellerObj
    });
  } catch (error) {
    console.error("Get seller by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching seller"
    });
  }
};

export const getMySellerProfile = async (req, res) => {
  try {
    const { email } = req.body; // Get email from request body

    const seller = await Seller.findOne({ email })
;

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found"
      });
    }

    res.json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error("Get my seller profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching seller profile"
    });
  }
};

export const updateSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.businessRegistrationNumber;
    delete updates.verificationStatus;
    delete updates.verifiedAt;
    delete updates.verifiedBy;

    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admin can update seller profiles"
      });
    }

    if (req.files) {
      const documentTypes = [
        'businessRegistrationCertificate', 
        'bankStatement', 
        'idProof',
        'tradingLicense'
      ];
      
      documentTypes.forEach(docType => {
        if (req.files[docType]) {
          if (seller.documents[docType] && seller.documents[docType].key) {
            deleteFile(seller.documents[docType].key);
          }
          seller.documents[docType] = {
            filename: req.files[docType][0].originalname,
            path: req.files[docType][0].location,
            key: req.files[docType][0].key
          };
        }
      });
    }

    Object.assign(seller, updates);
    await seller.save();

    res.json({
      success: true,
      message: "Seller updated successfully",
      data: seller.getPublicProfile()
    });
  } catch (error) {
    if (req.files) {
      Object.values(req.files).flat().forEach((file) => {
        if (file.key) {
          deleteFile(file.key);
        }
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }

    console.error("Update seller error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating seller"
    });
  }
};

export const deleteSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete sellers"
      });
    }

    if (seller.documents) {
      Object.values(seller.documents).forEach(doc => {
        if (doc && doc.key) {
          deleteFile(doc.key);
        }
      });
    }

    await Seller.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Seller deleted successfully"
    });
  } catch (error) {
    console.error("Delete seller error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting seller"
    });
  }
};

export const verifySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved' or 'rejected'"
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when rejecting"
      });
    }

    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    seller.verificationStatus = status;
    seller.verifiedBy = req.user._id;
    seller.verifiedAt = new Date();

    if (status === 'rejected') {
      seller.rejectionReason = rejectionReason;
    } else {
      seller.rejectionReason = undefined;
    }

    await seller.save();

    res.json({
      success: true,
      message: `Seller ${status} successfully`,
      data: {
        sellerId: seller._id,
        verificationStatus: seller.verificationStatus,
        rejectionReason: seller.rejectionReason,
        verifiedAt: seller.verifiedAt
      }
    });
  } catch (error) {
    console.error("Verify seller error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying seller"
    });
  }
};

export const getSellerStats = async (req, res) => {
  try {
    const totalSellers = await Seller.countDocuments();
    const pendingSellers = await Seller.countDocuments({ verificationStatus: 'pending' });
    const approvedSellers = await Seller.countDocuments({ verificationStatus: 'approved' });
    const rejectedSellers = await Seller.countDocuments({ verificationStatus: 'rejected' });

    const districtStats = await Seller.aggregate([
      {
        $group: {
          _id: '$businessAddress.district',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const businessTypeStats = await Seller.aggregate([
      {
        $group: {
          _id: '$businessType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalSellers,
        pendingSellers,
        approvedSellers,
        rejectedSellers,
        districtStats,
        businessTypeStats
      }
    });
  } catch (error) {
    console.error("Get seller stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching seller statistics"
    });
  }
};

export const getPendingSellers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const sellers = await Seller.find({ verificationStatus: 'pending' })
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Seller.countDocuments({ verificationStatus: 'pending' });

    const sellersWithDocs = sellers.map(seller => {
      const sellerObj = seller.toObject();
      delete sellerObj.password;
      delete sellerObj.rejectionReason;
      return sellerObj;
    });

    res.json({
      success: true,
      data: {
        sellers: sellersWithDocs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPending: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Get pending sellers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching pending sellers"
    });
  }
};

export const approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    if (seller.verificationStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: "Seller is already approved"
      });
    }

    seller.verificationStatus = 'approved';
    seller.verifiedBy = req.user._id;
    seller.verifiedAt = new Date();
    seller.rejectionReason = null;

    await seller.save();

    res.json({
      success: true,
      message: "Seller approved successfully",
      data: {
        sellerId: seller._id,
        businessName: seller.businessName,
        verificationStatus: seller.verificationStatus,
        verifiedAt: seller.verifiedAt
      }
    });
  } catch (error) {
    console.error("Approve seller error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while approving seller"
    });
  }
};

export const rejectSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { rejectionReason
    } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    if (seller.verificationStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: "Seller is already rejected"
      });
    }

    seller.verificationStatus = 'rejected';
    seller.verifiedBy = req.user._id;
    seller.verifiedAt = new Date();
    seller.rejectionReason = rejectionReason;

    await seller.save();

    res.json({
      success: true,
      message: "Seller rejected successfully",
      data: {
        sellerId: seller._id,
        businessName: seller.businessName,
        verificationStatus: seller.verificationStatus,
        rejectionReason: seller.rejectionReason,
        rejectedAt: seller.verifiedAt
      }
    });
  } catch (error) {
    console.error("Reject seller error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while rejecting seller"
    });
  }
};

export const testSellerCreation = async (req, res) => {
  try {
    const testData = {
      name: 'Test Seller',
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'password123',
      businessName: 'Test Business',
      businessType: 'Test Type',
      businessRegistrationNumber: 'TEST123',
      verificationStatus: 'pending'
    };
    
    const seller = new Seller(testData);
    await seller.save();
    await Seller.findByIdAndDelete(seller._id);
    
    res.json({
      success: true,
      message: 'Test seller creation successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test seller creation failed',
      error: error.message
    });
  }
};

export const clearAllSellers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admin can clear all sellers"
      });
    }

    const result = await Seller.deleteMany({});
    
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} sellers from database`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while clearing sellers"
    });
  }
};

