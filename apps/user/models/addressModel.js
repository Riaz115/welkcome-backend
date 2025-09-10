import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      minlength: [2, 'Contact name must be at least 2 characters long'],
      maxlength: [100, 'Contact name cannot exceed 100 characters']
    },
    
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      minlength: [10, 'Contact phone must be at least 10 characters long'],
      maxlength: [20, 'Contact phone cannot exceed 20 characters'],
      match: [/^[0-9+\-\s()]+$/, 'Contact phone must contain only numbers, +, -, spaces, and parentheses']
    },
    
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      minlength: [2, 'Country must be at least 2 characters long'],
      maxlength: [100, 'Country cannot exceed 100 characters']
    },
    
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      minlength: [2, 'City must be at least 2 characters long'],
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    
    area: {
      type: String,
      trim: true,
      maxlength: [100, 'Area cannot exceed 100 characters']
    },
    
    streetAddress: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      minlength: [5, 'Street address must be at least 5 characters long'],
      maxlength: [300, 'Street address cannot exceed 300 characters']
    },
    
    buildingName: {
      type: String,
      trim: true,
      maxlength: [100, 'Building name cannot exceed 100 characters']
    },
    
    houseNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'House number cannot exceed 50 characters']
    },
    
    apartmentNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Apartment number cannot exceed 50 characters']
    },
    
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Postal code cannot exceed 20 characters']
    },
    
    landmark: {
      type: String,
      trim: true,
      maxlength: [200, 'Landmark cannot exceed 200 characters']
    },
    
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    
    isDefault: {
      type: Boolean,
      default: false
    },
    
    isActive: {
      type: Boolean,
      default: true
    },
    
    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: [300, 'Delivery instructions cannot exceed 300 characters']
    }
  },
  {
    timestamps: true,
  }
);

addressSchema.index({ userId: 1, isActive: 1 });
addressSchema.index({ userId: 1, isDefault: 1 });

addressSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

addressSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.houseNumber,
    this.apartmentNumber,
    this.buildingName,
    this.streetAddress,
    this.area,
    this.city,
    this.state,
    this.postalCode,
    this.country
  ].filter(Boolean);
  
  return parts.join(', ');
});

addressSchema.set('toJSON', { virtuals: true });
addressSchema.set('toObject', { virtuals: true });

const Address = mongoose.model("Address", addressSchema);

export default Address;
