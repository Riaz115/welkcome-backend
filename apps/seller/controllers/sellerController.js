import Seller from "../models/Seller.js";
import { generateToken } from "../middleware/auth.js";
import { deleteFile } from "../middleware/upload.js";
import path from "path";

// @desc    Register a new seller
// @route   POST /api/sellers/register
// @access  Public
export const registerSeller = async (req, res) => {
  try {
    const {
      storeName,
      ownerName,
      email,
      phone,
      password,
      businessRegistrationNumber,
      tinNumber,
      address,
      bankDetails,
    } = req.body;

    // Check if seller already exists
    const existingSeller = await Seller.findOne({
      $or: [
        { email },
        { phone },
        { businessRegistrationNumber },
        { tinNumber },
      ],
    });

    if (existingSeller) {
      // Clean up uploaded files if seller exists
      if (req.files) {
        Object.values(req.files)
          .flat()
          .forEach((file) => {
            deleteFile(file.path);
          });
      }

      return res.status(400).json({
        success: false,
        message:
          "Seller with this email, phone, business registration number, or TIN already exists.",
      });
    }

    // Parse address and bankDetails if they're strings
    const parsedAddress =
      typeof address === "string" ? JSON.parse(address) : address;
    const parsedBankDetails =
      typeof bankDetails === "string" ? JSON.parse(bankDetails) : bankDetails;

    // Create seller object
    const sellerData = {
      storeName,
      ownerName,
      email,
      phone,
      password,
      businessRegistrationNumber,
      tinNumber,
      address: parsedAddress,
      bankDetails: parsedBankDetails,
    };

    // Add document paths if files were uploaded
    if (req.files) {
      sellerData.documents = {};

      if (req.files.idProof) {
        sellerData.documents.idProof = {
          filename: req.files.idProof[0].filename,
          path: req.files.idProof[0].path,
        };
      }

      if (req.files.storeLicense) {
        sellerData.documents.storeLicense = {
          filename: req.files.storeLicense[0].filename,
          path: req.files.storeLicense[0].path,
        };
      }
    }

    const seller = new Seller(sellerData);
    await seller.save();

    // Generate token
    const token = generateToken(seller._id);

    res.status(201).json({
      success: true,
      message: "Seller registered successfully",
      data: {
        seller: seller.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          deleteFile(file.path);
        });
    }

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Login seller
// @route   POST /api/sellers/login
// @access  Public
export const loginSeller = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/phone and password are required",
      });
    }

    // Find seller by email or phone
    const seller = await Seller.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    }).select("+password");

    if (!seller) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await seller.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (!seller.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Update last login
    seller.lastLogin = new Date();
    await seller.save();

    // Generate token
    const token = generateToken(seller._id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        seller: seller.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Get seller profile
// @route   GET /api/sellers/profile/:id
// @access  Private
export const getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.params.id;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    res.json({
      success: true,
      data: seller.getPublicProfile(),
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// @desc    Update seller profile
// @route   PUT /api/sellers/profile/:id
// @access  Private
export const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.email;
    delete updates.phone;
    delete updates.businessRegistrationNumber;
    delete updates.tinNumber;
    delete updates.verificationStatus;
    delete updates.role;
    delete updates.documents;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Update seller
    Object.assign(seller, updates);
    await seller.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: seller.getPublicProfile(),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// @desc    Upload/replace KYC documents
// @route   POST /api/sellers/upload-docs
// @access  Private
export const uploadDocuments = async (req, res) => {
  try {
    const { docType } = req.body; // 'idProof' or 'storeLicense'
    const sellerId = req.seller._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!["idProof", "storeLicense"].includes(docType)) {
      deleteFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid document type. Must be "idProof" or "storeLicense"',
      });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Delete old file if exists
    if (
      seller.documents &&
      seller.documents[docType] &&
      seller.documents[docType].path
    ) {
      deleteFile(seller.documents[docType].path);
    }

    // Update document
    if (!seller.documents) {
      seller.documents = {};
    }

    seller.documents[docType] = {
      filename: req.file.filename,
      path: req.file.path,
      uploadedAt: new Date(),
    };

    // Reset verification status to pending if documents are re-uploaded
    seller.verificationStatus = "pending";
    seller.rejectionReason = undefined;

    await seller.save();

    res.json({
      success: true,
      message: `${docType} uploaded successfully`,
      data: {
        document: seller.documents[docType],
        verificationStatus: seller.verificationStatus,
      },
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      deleteFile(req.file.path);
    }

    console.error("Upload documents error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading document",
    });
  }
};

// @desc    Update seller verification status (Admin only)
// @route   PATCH /api/sellers/status
// @access  Private (Admin)
export const updateVerificationStatus = async (req, res) => {
  try {
    const { sellerId, status, rejectionReason } = req.body;

    if (!sellerId || !status) {
      return res.status(400).json({
        success: false,
        message: "Seller ID and status are required",
      });
    }

    if (!["pending", "verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "pending", "verified", or "rejected"',
      });
    }

    if (status === "rejected" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when status is "rejected"',
      });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    seller.verificationStatus = status;
    if (status === "rejected") {
      seller.rejectionReason = rejectionReason;
    } else {
      seller.rejectionReason = undefined;
    }

    await seller.save();

    res.json({
      success: true,
      message: "Verification status updated successfully",
      data: {
        sellerId: seller._id,
        verificationStatus: seller.verificationStatus,
        rejectionReason: seller.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating verification status",
    });
  }
};

// @desc    Get seller verification status
// @route   GET /api/sellers/status/:id
// @access  Public
export const getVerificationStatus = async (req, res) => {
  try {
    const sellerId = req.params.id;

    const seller = await Seller.findById(sellerId).select(
      "verificationStatus rejectionReason storeName"
    );
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    res.json({
      success: true,
      data: {
        sellerId: seller._id,
        storeName: seller.storeName,
        verificationStatus: seller.verificationStatus,
        rejectionReason: seller.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Get status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching verification status",
    });
  }
};
