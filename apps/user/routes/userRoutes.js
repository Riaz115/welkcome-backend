import express from "express";
import { isLoggedIn } from "../../auth/validators/authValidator.js";
import { requireAdmin } from "../../seller/middleware/auth.js"; 
import { changeEmail, changePassword, changePhone, getUserProfile, updateUserProfile, verifyOTP, getAllUsers, blockUser, unblockUser, getUserById } from "../controllers/userController.js"; 

const router = express.Router();

router.get("/profile", isLoggedIn, getUserProfile);
router.post("/change-email", isLoggedIn, changeEmail);
router.put("/profile", isLoggedIn, updateUserProfile);
router.put("/change-password", isLoggedIn, changePassword);
router.put("/change-phone", isLoggedIn, changePhone);
router.post("/verify-otp", isLoggedIn, verifyOTP);

// Admin routes
router.get("/all", isLoggedIn, requireAdmin, getAllUsers);
router.get("/:userId", isLoggedIn, requireAdmin, getUserById);
router.patch("/:userId/block", isLoggedIn, requireAdmin, blockUser);
router.patch("/:userId/unblock", isLoggedIn, requireAdmin, unblockUser);

export default router;