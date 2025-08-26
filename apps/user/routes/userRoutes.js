import express from "express";
import { isLoggedIn } from "../../auth/validators/authValidator.js"; 
import { changeEmail, changePassword, changePhone, getUserProfile, updateUserProfile, verifyOTP } from "../controllers/userController.js"; 

const router = express.Router();

router.get("/profile", isLoggedIn, getUserProfile);
router.post("/change-email", isLoggedIn, changeEmail);
router.put("/profile", isLoggedIn, updateUserProfile);
router.put("/change-password", isLoggedIn, changePassword);
router.put("/change-phone", isLoggedIn, changePhone);
router.post("/verify-otp", isLoggedIn, verifyOTP);


export default router;