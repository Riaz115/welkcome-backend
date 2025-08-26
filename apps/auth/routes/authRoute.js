import { Router } from "express";
import { firebaseSync, resetPassword, sendOTP, signup, verifyEmail, verifyOTP } from "../controllers/authController.js";
import { login } from "../controllers/authController.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post('/firebase-sync', firebaseSync);
router.get("/verify-email", verifyEmail);
export default router;
