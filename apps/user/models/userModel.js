import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Common fields for both manual & social auth
    uid: {
      type: String, // Firebase or Google unique ID
      default: null,
    },
    firstName: {
      type: String,
      trim: true,
      default: null, // Optional for Google sign-in
    },
    lastName: {
      type: String,
      trim: true,
      default: null, // Optional for Google sign-in
    },
    name: {
      type: String,
      trim: true,
      default: null, // For full name from Google
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: null,
    },
    dialCode: {
      type: String,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      minlength: 6,
      default: null, // Will be null for Google sign-in
    },
    token: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: null,
    },
    dob: {
      type: Date,
      default: null,
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
    isRider: {
      type: Boolean,
      default: false,
    },
    kycVerified: {
      type: Boolean,
      default: false,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ["manual", "google", "apple"],
      default: "manual",
    },
    profileImage: {
      type: String,
      default: null,
    },
    verificationToken : {
      type: String,
      default: null, // For email verification
    }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
