import express from "express";
import { isLoggedIn } from "../../auth/validators/authValidator.js";
import {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
  getAddressStats,
  searchAddressesByLocation,
  bulkUpdateAddresses
} from "../controllers/addressController.js";

const router = express.Router();

router.use(isLoggedIn);

router.post("/", createAddress);
router.get("/", getUserAddresses);
router.get("/stats", getAddressStats);
router.get("/default", getDefaultAddress);
router.get("/search", searchAddressesByLocation);
router.get("/:addressId", getAddressById);
router.put("/:addressId", updateAddress);
router.patch("/:addressId/default", setDefaultAddress);
router.delete("/:addressId", deleteAddress);
router.post("/bulk", bulkUpdateAddresses);

export default router;
