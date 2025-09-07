import User from "../../user/models/userModel.js";
import Seller from "../../seller/models/Seller.js";
import { generateJwtToken } from "../services/generateJWT.js";
import { hashPassword, comparePassword } from "../services/bcrypt.js";
import crypto from "crypto";
import {
  sendSMS,
  sendEmail,
  sendVerificationEmail,
} from "../services/nodemailer.js";
import OTP from "../models/otpModel.js";

export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dialCode, password, gender, dob } =
      req.body;

    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if user already exists by phone number
    const existingUserByPhone = await User.findOne({ phone });
    if (existingUserByPhone) {
      return res.status(400).json({ message: "User already exists" });
    }

    const fullPhoneNumber = dialCode + phone;
    
    const otpRecord = await OTP.findOne({
      $or: [
        { identifier: email },
        { identifier: fullPhoneNumber }
      ],
      purpose: "signup",
      verified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified or expired. Please verify OTP first.",
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      dialCode,
      password: hashedPassword,
      gender,
      dob,
    });

    const token = await generateJwtToken(user._id, user.email, 'user');
    user.token = token;
    await user.save();

    res.status(201).json({
      status: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


export const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    const isPlainPhone = /^[0-9]{10}$/.test(emailOrPhone);
    const isDialCodePhone = /^\+\d{1,4}\d{6,14}$/.test(emailOrPhone);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone);

    if (isPlainPhone) {
      return res.status(400).json({
        status: false,
        message: "Please include dial code (e.g., +91) with your phone number",
      });
    }

    if (!isEmail && !isDialCodePhone) {
      return res.status(400).json({
        status: false,
        message: "Invalid email or phone format",
      });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone },
        { $expr: { $eq: [{ $concat: ["$dialCode", "$phone"] }, emailOrPhone] } }
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordMatch = password === user.password
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = await generateJwtToken(user._id, user.email, 'user');
    user.token = token;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message || "Login error",
    });
  }
};





export const sendOTP = async (req, res) => {
  try {
    const { identifier, purpose, email } = req.body;

    if (!identifier || !purpose) {
      return res.status(400).json({
        status: false,
        message: "Identifier and purpose are required.",
      });
    }

    if (purpose === "reset-password") {
      const user = identifier.includes("@")
          ? await User.findOne({ email: identifier })
          : await User.findOne({
            $or: [
              { phone: identifier },
              { $expr: { $eq: [{ $concat: ["$dialCode", "$phone"] }, identifier] } },
            ],
          });

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "Email or phone does not exist.",
        });
      }
    }

    if (purpose === "signup") {
      if (!identifier.includes("@")) {
        const existingPhoneUser = await User.findOne({
          $or: [
            { phone: identifier },
            { $expr: { $eq: [{ $concat: ["$dialCode", "$phone"] }, identifier] } },
          ],
        });

        if (existingPhoneUser) {
          return res.status(400).json({
            status: false,
            message: "This phone number is already registered.",
          });
        }

        if (email) {
          const existingEmailUser = await User.findOne({ email });
          if (existingEmailUser) {
            return res.status(400).json({
              status: false,
              message: "This email is already associated with another account.",
            });
          }
        }
      } else {
        const existingEmailUser = await User.findOne({ email: identifier });
        if (existingEmailUser) {
          return res.status(400).json({
            status: false,
            message: "This email is already registered.",
          });
        }
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    await OTP.findOneAndUpdate(
        { identifier, purpose },
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

    if (identifier.includes("@")) {
      await sendEmail(identifier, otp);
    } else {
      await sendSMS(identifier, otp);
    }

    return res.status(200).json({
      status: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};




export const verifyOTP = async (req, res) => {
  try {
    const { identifier, purpose, otp } = req.body;

    if (!identifier || !purpose || !otp) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
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

    if (otpRecord.verified) {
      return res.status(200).json({
        status: true,
        message: "OTP was already verified.",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json({
      status: true,
      message: "OTP verified successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to verify OTP.",
      error: error.message,
    });
  }
};
export const verifyEmail = async (req, res) => {
  const { token, email } = req.query;

  try {
    const user = await User.findOne({ email, verificationToken: token });

    if (!user) return res.status(400).send("Invalid or expired token");

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send("Email verified! You can now log in.");
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
};

export const firebaseSync = async (req, res) => {
  try {
    const { uid, email, name, profileImage, source } = req.body;

    if (!uid || !email || !name || !source) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let user = await User.findOne({ email });

    if (user && user.emailVerified) {
      const token = await generateJwtToken(user._id, user.email, 'user');
      return res.status(200).json({
        success: true,
        token,
        user: {
          _id: user._id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          gender: user.gender,
          dob: user.dob,
          isSeller: user.isSeller,
          isRider: user.isRider,
          kycVerified: user.kycVerified,
          profileCompleted: user.profileCompleted,
          source: user.source,
          profileImage: user.profileImage,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    }

    if (user && !user.emailVerified) {
      const verificationToken = crypto.randomBytes(32).toString("hex");

      user.verificationToken = verificationToken;
      user.uid = uid;
      user.name = name;
      user.source = source;
      user.profileImage = profileImage || user.profileImage || null;

      await user.save();
      await sendVerificationEmail(email, verificationToken);

      return res.status(401).json({
        success: false,
        message: "Email not verified. Verification link sent.",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await User.create({
      uid,
      email,
      name,
      source,
      profileImage: profileImage || null,
      emailVerified: false,
      password: null,
      verificationToken,

      firstName: null,
      lastName: null,
      phone: null,
      token: null,
      gender: null,
      dob: null,
      isSeller: false,
      isRider: false,
      kycVerified: false,
      profileCompleted: false,
    });

    await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
      success: false,
      message: "User created. Verification link sent to email.",
      user: {
        _id: newUser._id,
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.name,
        source: newUser.source,
        emailVerified: newUser.emailVerified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;

    if (!identifier || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Identifier and new password are required.",
      });
    }

    const otpRecord = await OTP.findOne({
      identifier,
      purpose: "reset-password",
      verified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified or expired. Please verify OTP first.",
      });
    }

    let user;
    if (identifier.includes("@")) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findOne({
        $or: [
          { phone: identifier },
          { $expr: { $eq: [{ $concat: ["$dialCode", "$phone"] }, identifier] } }
        ]
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email, role: 'user' });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = await generateJwtToken(user._id, user.email, 'user');

    res.json({
      success: true,
      message: "User login successful",
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: 'user'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during login for user login "
    });
  }
};

export const adminSellerLogin = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone and password are required"
      });
    }

    const admin = await User.findOne({ email: emailOrPhone, role: 'admin' });
    if (admin) {
      const isPasswordValid = await comparePassword(password, admin.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = await generateJwtToken(admin._id, admin.email, 'admin');
      
      return res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          token,
          user: {
            id: admin._id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            role: 'admin'
          }
        }
      });
    }

    const seller = await Seller.findOne({ email: emailOrPhone });
    
    if (seller) {
      const isPasswordValid = await comparePassword(password, seller.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }

      if (seller.verificationStatus === 'rejected') {
        return res.status(403).json({
          success: false,
          message: "Your seller account has been rejected",
          rejectionReason: seller.rejectionReason
        });
      }
      
      if (seller.verificationStatus === 'pending' || seller.verificationStatus === 'approved') {
        const token = await generateJwtToken(seller._id, seller.email, 'seller');

        return res.json({
          success: true,
          message: "Seller login successful",
          data: {
            token,
            user: {
              id: seller._id,
              name: seller.name,
              email: seller.email,
              businessName: seller.businessName,
              role: 'seller',
              verificationStatus: seller.verificationStatus
            }
          }
        });
      }
    }

    res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });

  } catch (error) {
    console.error('Admin-Seller Login Error:', error);
    
    const errorResponse = {
      success: false,
      message: "Server error during login",
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    };
    
    res.status(500).json(errorResponse);
  }
};

export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required"
      });
    }

    // First try to find as admin in User collection
    const admin = await User.findOne({ _id: id, role: 'admin' });
    if (admin) {
      // Convert admin to object and remove password
      const adminData = admin.toObject();
      delete adminData.password;
      delete adminData.token;
      
      return res.json({
        success: true,
        message: "Admin profile retrieved successfully",
        data: {
          ...adminData,
          role: 'admin'
        }
      });
    }

    // If not admin, try to find as seller
    const seller = await Seller.findOne({ _id: id });
    if (seller) {
      // Convert seller to object and remove password
      const sellerData = seller.toObject();
      delete sellerData.password;
      
      return res.json({
        success: true,
        message: "Seller profile retrieved successfully",
        data: {
          ...sellerData,
          role: 'seller'
        }
      });
    }

    // If neither admin nor seller found
    return res.status(404).json({
      success: false,
      message: "Profile not found"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving profile",
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message
      })
    });
  }
};