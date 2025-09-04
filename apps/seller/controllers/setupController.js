import User from '../../user/models/userModel.js';
import bcrypt from 'bcryptjs';

export const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const admin = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'admin',
      emailVerified: true,
      profileCompleted: true
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating admin'
    });
  }
};

export const checkAdminExists = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    res.json({
      success: true,
      data: {
        adminExists: adminCount > 0,
        adminCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while checking admin'
    });
  }
};
