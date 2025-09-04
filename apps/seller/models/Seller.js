import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    trim: true
  },
  businessRegistrationNumber: {
    type: String,
    required: [true, 'Business registration number is required'],
    unique: true,
    trim: true
  },
  businessAddress: {
    district: {
      type: String,
      trim: true
    },
    subCounty: {
      type: String,
      trim: true
    },
    village: {
      type: String,
      trim: true
    },
    street: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    }
  },
  contactPerson: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  },
  bankDetails: {
    bankName: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    },
    accountName: {
      type: String,
      trim: true
    },
    swiftCode: {
      type: String,
      trim: true
    }
  },
  businessEmail: {
    type: String,
    trim: true
  },
  businessDescription: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  socialMedia: {
    facebook: {
      type: String,
      trim: true
    },
    instagram: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    linkedin: {
      type: String,
      trim: true
    }
  },
  paymentMethods: [{
    type: String
  }],
  deliveryOptions: [{
    type: String
  }],
  documents: {
    businessRegistrationCertificate: {
      filename: String,
      path: String,
      key: String, // S3 key for deletion
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    bankStatement: {
      filename: String,
      path: String,
      key: String, // S3 key for deletion
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    idProof: {
      filename: String,
      path: String,
      key: String, // S3 key for deletion
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    tradingLicense: {
      filename: String,
      path: String,
      key: String, // S3 key for deletion
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

sellerSchema.index({ verificationStatus: 1 });
sellerSchema.index({ 'businessAddress.district': 1 });
sellerSchema.index({ businessType: 1 });

sellerSchema.methods.getPublicProfile = function() {
  const sellerObject = this.toObject();
  delete sellerObject.documents;
  delete sellerObject.bankDetails;
  delete sellerObject.rejectionReason;
  return sellerObject;
};

sellerSchema.methods.getAdminProfile = function() {
  return this.toObject();
};

const Seller = mongoose.model('Seller', sellerSchema);

export default Seller; 