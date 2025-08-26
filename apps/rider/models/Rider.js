import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const riderSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^(\+256|0)[0-9]{9}$/, 'Please enter a valid Uganda phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: {
      values: ['boda-boda', 'taxi', 'pickup', 'motorcycle', 'car'],
      message: 'Vehicle type must be one of: boda-boda, taxi, pickup, motorcycle, car'
    },
    lowercase: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{6,15}$/, 'License number must be 6-15 alphanumeric characters']
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
  documents: {
    idProof: {
      filename: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    driverLicense: {
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
    default: 'rider',
    enum: ['rider', 'admin']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: false // Riders are not available until verified
  },
  lastLogin: {
    type: Date
  },
  // Additional rider-specific fields
  experienceYears: {
    type: Number,
    min: [0, 'Experience years cannot be negative'],
    max: [50, 'Experience years cannot exceed 50']
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      match: [/^(\+256|0)[0-9]{9}$/, 'Please enter a valid Uganda phone number for emergency contact']
    },
    relationship: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
riderSchema.index({ verificationStatus: 1 });
riderSchema.index({ vehicleType: 1 });
riderSchema.index({ isActive: 1, isAvailable: 1 });

// Hash password before saving
riderSchema.pre('save', async function(next) {
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
riderSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile (excluding sensitive data)
riderSchema.methods.getPublicProfile = function() {
  const riderObject = this.toObject();
  delete riderObject.password;
  return riderObject;
};

// Instance method to check if rider can be activated
riderSchema.methods.canBeActivated = function() {
  return this.verificationStatus === 'verified' && 
         this.documents.idProof && 
         this.documents.driverLicense;
};

const Rider = mongoose.model('Rider', riderSchema);

export default Rider; 