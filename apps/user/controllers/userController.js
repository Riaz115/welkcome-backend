import OTP from "../../auth/models/otpModel.js";
import { comparePassword, hashPassword } from "../../auth/services/bcrypt.js";
import User from "../models/userModel.js";
import crypto from "crypto";

export const getUserProfile = (req, res) => {
  // req.user is set by isLoggedIn middleware
  res.status(200).json({
    status: true,
    user: req.user, 
  });
};


export const changeEmail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newEmail } = req.body;

    // Validate required fields
    if (!currentPassword || !newEmail) {
      return res.status(400).json({ message: "CurrentPassword and newEmail are required" });
    }

    // Check email format
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    // Find user and verify password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the password is correct
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    // Check if user is trying to change to the same email they already have
    if (user.email === newEmail) {
      return res.status(400).json({ message: "You already have same email" });
    }

    // Check if email already exists for another user
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(409).json({ message: "Same email exists" });
    }

    // Send new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    await OTP.findOneAndUpdate(
      { identifier: newEmail, purpose: "change-email" },
      {
        otp: hashedOTP,
        verified: false,
        createdAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // Import sendEmail function at the top if not already imported
    const { sendEmail } = await import("../../auth/services/nodemailer.js");
    await sendEmail(newEmail, otp);

    res.status(200).json({
      status: true,
      message: "OTP sent to new email successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users"
    });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: "Cannot block admin users"
      });
    }

    user.isBlocked = true;
    user.blockedAt = new Date();
    user.blockedBy = req.user._id;
    user.blockReason = "Blocked by admin";

    await user.save();

    res.json({
      success: true,
      message: "User blocked successfully",
      data: {
        userId: user._id,
        isBlocked: user.isBlocked,
        blockedAt: user.blockedAt
      }
    });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while blocking user"
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -token -verificationToken')
      .populate('blockedBy', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user"
    });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isBlocked = false;
    user.blockedAt = null;
    user.blockedBy = null;
    user.blockReason = null;

    await user.save();

    res.json({
      success: true,
      message: "User unblocked successfully",
      data: {
        userId: user._id,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while unblocking user"
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, gender, dob } = req.body;

    // Optional: validate fields (you can make these more strict if needed)
    if (!firstName || !lastName || !gender || !dob) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, gender, dob },
      { new: true, runValidators: true, select: "-password" }
    );

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};


export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    // Basic validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both old and new passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare old password
    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    // Hash and set new password
    user.password = await hashPassword(newPassword);
    await user.save();

    res.status(200).json({
      status: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};



export const changePhone = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password, newPhone, dialCode } = req.body;

    // Validate required fields
    if (!password || !newPhone || !dialCode) {
      return res.status(400).json({ message: "Password, newPhone, and dialCode are required" });
    }

    // Find user and verify password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the password is correct
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Create full phone number
    const fullPhoneNumber = dialCode + newPhone;

    // Check if user is trying to change to the same phone they already have
    if (user.phone === newPhone) {
      return res.status(400).json({ message: "You already have same phone" });
    }

    // Check if this phone number already exists for another user
    const existingUser = await User.findOne({ phone: newPhone });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(409).json({ message: "Same number exists" });
    }

    // Check if OTP is already verified for this phone number
    const verifiedOTP = await OTP.findOne({
      identifier: fullPhoneNumber,
      purpose: "change-phone",
      verified: true
    });

    if (verifiedOTP) {
      // OTP is verified, update the phone number (store without dial code)
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { phone: newPhone },
        { new: true, select: "-password" }
      );

      // Cleanup: remove OTP record
      await OTP.deleteOne({ _id: verifiedOTP._id });

      return res.status(200).json({
        status: true,
        message: "Phone number updated successfully",
        phone: updatedUser.dialCode + updatedUser.phone,
      });
    }

    // OTP not verified, send new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    await OTP.findOneAndUpdate(
      { identifier: fullPhoneNumber, purpose: "change-phone" },
      {
        otp: hashedOTP,
        verified: false,
        createdAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // Import sendSMS function at the top if not already imported
    const { sendSMS } = await import("../../auth/services/nodemailer.js");
    await sendSMS(fullPhoneNumber, otp);

    res.status(200).json({
      status: true,
      message: "OTP sent to new phone number successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const userId = req.user._id;
    const { identifier, purpose, otp } = req.body;

    if (!identifier || !purpose || !otp) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }

    // Only allow change-email and change-phone purposes
    if (!["change-email", "change-phone"].includes(purpose)) {
      return res.status(400).json({
        status: false,
        message: "Invalid purpose. Only change-email and change-phone are allowed.",
      });
    }

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const otpRecord = await OTP.findOne({
      identifier,
      purpose,
      otp: hashedOTP,
    });

    if (!otpRecord) {
      return res.status(400).json({
        status: false,
        message: "Invalid or expired OTP.",
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    // Update user based on purpose
    if (purpose === "change-email") {
      // Check if email already exists for another user
      const existingUser = await User.findOne({ email: identifier });
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        return res.status(409).json({
          status: false,
          message: "Email already exists for another user.",
        });
      }

      user.email = identifier;
      await user.save();

      // Delete OTP after successful update
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(200).json({
        status: true,
        message: "Email updated successfully!",
        email: user.email,
      });
    }

    if (purpose === "change-phone") {
      // Extract phone number from identifier (remove dial code)
      // Assuming identifier is in format like "+1234567890"
      // We need to find the user's current dialCode to extract just the phone
      const userDialCode = user.dialCode;
      const newPhone = identifier.startsWith(userDialCode) 
        ? identifier.substring(userDialCode.length) 
        : identifier;

      // Check if phone already exists for another user
      const existingUser = await User.findOne({ phone: newPhone });
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        return res.status(409).json({
          status: false,
          message: "Phone number already exists for another user.",
        });
      }

      user.phone = newPhone;
      await user.save();

      // Delete OTP after successful update
      await OTP.deleteOne({ _id: otpRecord._id });

      return res.status(200).json({
        status: true,
        message: "Phone number updated successfully!",
        phone: user.dialCode + user.phone,
      });
    }

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to verify OTP.",
      error: error.message,
    });
  }
};
