import Rider from "../models/Rider.js";
import { generateToken } from "../middleware/auth.js";
import { deleteFile } from "../middleware/upload.js";

// @desc    Register a new rider
// @route   POST /api/riders/register
// @access  Public
export const registerRider = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      password,
      vehicleType,
      licenseNumber,
      address,
      experienceYears,
      emergencyContact
    } = req.body;

    // Check if rider already exists
    const existingRider = await Rider.findOne({
      $or: [
        { email },
        { phone },
        { licenseNumber }
      ],
    });

    if (existingRider) {
      // Clean up uploaded files if rider exists
      if (req.files) {
        Object.values(req.files)
          .flat()
          .forEach((file) => {
            deleteFile(file.path);
          });
      }

      return res.status(400).json({
        success: false,
        message: "Rider with this email, phone, or license number already exists.",
      });
    }

    // Parse address and emergencyContact if they're strings
    const parsedAddress = typeof address === "string" ? JSON.parse(address) : address;
    const parsedEmergencyContact = emergencyContact && typeof emergencyContact === "string" 
      ? JSON.parse(emergencyContact) : emergencyContact;

    // Create rider object
    const riderData = {
      fullName,
      phone,
      email,
      password,
      vehicleType,
      licenseNumber,
      address: parsedAddress,
      experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
      emergencyContact: parsedEmergencyContact
    };

    // Add document paths if files were uploaded
    if (req.files) {
      riderData.documents = {};

      if (req.files.idProof) {
        riderData.documents.idProof = {
          filename: req.files.idProof[0].filename,
          path: req.files.idProof[0].path,
        };
      }

      if (req.files.driverLicense) {
        riderData.documents.driverLicense = {
          filename: req.files.driverLicense[0].filename,
          path: req.files.driverLicense[0].path,
        };
      }
    }

    const rider = new Rider(riderData);
    await rider.save();

    // Generate token
    const token = generateToken(rider._id);

    res.status(201).json({
      success: true,
      message: "Rider registered successfully",
      data: {
        rider: rider.getPublicProfile(),
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

// @desc    Login rider
// @route   POST /api/riders/login
// @access  Public
export const loginRider = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/phone and password are required",
      });
    }

    // Find rider by email or phone
    const rider = await Rider.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    }).select("+password");

    if (!rider) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await rider.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (!rider.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Update last login
    rider.lastLogin = new Date();
    await rider.save();

    // Generate token
    const token = generateToken(rider._id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        rider: rider.getPublicProfile(),
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

// @desc    Get rider profile
// @route   GET /api/riders/profile/:id
// @access  Private
export const getRiderProfile = async (req, res) => {
  try {
    const riderId = req.params.id;

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    res.json({
      success: true,
      data: rider.getPublicProfile(),
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// @desc    Update rider profile
// @route   PUT /api/riders/profile/:id
// @access  Private
export const updateRiderProfile = async (req, res) => {
  try {
    const riderId = req.params.id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.email;
    delete updates.phone;
    delete updates.licenseNumber;
    delete updates.verificationStatus;
    delete updates.role;
    delete updates.documents;

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Update rider
    Object.assign(rider, updates);
    await rider.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: rider.getPublicProfile(),
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

// @desc    Upload/replace rider documents
// @route   POST /api/riders/upload-docs
// @access  Private
export const uploadDocuments = async (req, res) => {
  try {
    const { docType } = req.body; // 'idProof' or 'driverLicense'
    const riderId = req.rider._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!["idProof", "driverLicense"].includes(docType)) {
      deleteFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid document type. Must be "idProof" or "driverLicense"',
      });
    }

    const rider = await Rider.findById(riderId);
    if (!rider) {
      deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Delete old file if exists
    if (
      rider.documents &&
      rider.documents[docType] &&
      rider.documents[docType].path
    ) {
      deleteFile(rider.documents[docType].path);
    }

    // Update document
    if (!rider.documents) {
      rider.documents = {};
    }

    rider.documents[docType] = {
      filename: req.file.filename,
      path: req.file.path,
      uploadedAt: new Date(),
    };

    // Reset verification status to pending if documents are re-uploaded
    rider.verificationStatus = "pending";
    rider.rejectionReason = undefined;

    await rider.save();

    res.json({
      success: true,
      message: `${docType} uploaded successfully`,
      data: {
        document: rider.documents[docType],
        verificationStatus: rider.verificationStatus,
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

// @desc    Update rider verification status (Admin only)
// @route   PATCH /api/riders/status
// @access  Private (Admin)
export const updateVerificationStatus = async (req, res) => {
  try {
    const { riderId, status, rejectionReason } = req.body;

    if (!riderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Rider ID and status are required",
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

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    rider.verificationStatus = status;
    if (status === "rejected") {
      rider.rejectionReason = rejectionReason;
      rider.isAvailable = false; // Rejected riders cannot be available
    } else if (status === "verified") {
      rider.rejectionReason = undefined;
      // Verified riders can potentially be available (but default to false)
      // They can manually set availability later
    } else {
      rider.rejectionReason = undefined;
      rider.isAvailable = false; // Pending riders cannot be available
    }

    await rider.save();

    res.json({
      success: true,
      message: "Verification status updated successfully",
      data: {
        riderId: rider._id,
        verificationStatus: rider.verificationStatus,
        rejectionReason: rider.rejectionReason,
        isAvailable: rider.isAvailable,
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

// @desc    Get rider verification status
// @route   GET /api/riders/status/:id
// @access  Public
export const getVerificationStatus = async (req, res) => {
  try {
    const riderId = req.params.id;

    const rider = await Rider.findById(riderId).select(
      "verificationStatus rejectionReason fullName vehicleType isAvailable"
    );
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    res.json({
      success: true,
      data: {
        riderId: rider._id,
        fullName: rider.fullName,
        vehicleType: rider.vehicleType,
        verificationStatus: rider.verificationStatus,
        rejectionReason: rider.rejectionReason,
        isAvailable: rider.isAvailable,
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

// @desc    Update rider availability
// @route   PATCH /api/riders/availability/:id
// @access  Private
export const updateAvailability = async (req, res) => {
  try {
    const riderId = req.params.id;
    const { isAvailable } = req.body;

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Only verified riders can change availability
    if (rider.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: "Only verified riders can change availability status",
      });
    }

    rider.isAvailable = isAvailable;
    await rider.save();

    res.json({
      success: true,
      message: `Availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
      data: {
        riderId: rider._id,
        isAvailable: rider.isAvailable,
        verificationStatus: rider.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating availability",
    });
  }
}; 