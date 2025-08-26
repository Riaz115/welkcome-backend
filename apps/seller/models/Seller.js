import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const sellerSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true,
    maxlength: [100, 'Owner name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^(\+256|0)[0-9]{9}$/, 'Please enter a valid Uganda phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  businessRegistrationNumber: {
    type: String,
    required: [true, 'Business registration number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  tinNumber: {
    type: String,
    required: [true, 'TIN number is required'],
    unique: true,
    trim: true,
    match: [/^[0-9]{10}$/, 'TIN number must be 10 digits']
  },
  address: {
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    subCounty: {
      type: String,
      required: [true, 'Sub-county is required'],
      trim: true
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
      trim: true
    }
  },
  bankDetails: {
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
      match: [/^[0-9]{10,20}$/, 'Account number must be between 10-20 digits']
    }
  },
  documents: {
    idProof: {
      filename: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    storeLicense: {
      filename: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    default: 'seller',
    enum: ['seller', 'admin']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance (only for fields without unique: true)
sellerSchema.index({ verificationStatus: 1 });

// Hash password before saving
sellerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
sellerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile (excluding sensitive data)
sellerSchema.methods.getPublicProfile = function() {
  const sellerObject = this.toObject();
  delete sellerObject.password;
  return sellerObject;
};

const Seller = mongoose.model('Seller', sellerSchema);

export default Seller; 