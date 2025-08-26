import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  purpose: { type: String, required: true }, // signup, login, forgot, phone-change
  otp: { type: String, required: true }, // hashed OTP
  createdAt: { type: Date, default: Date.now, expires: 300 },// expires in 5 mins
  verified: { type: Boolean, default: false }
});

export default mongoose.model("OTP", otpSchema);