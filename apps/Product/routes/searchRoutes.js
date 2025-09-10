import express from "express";
import {
  advancedProductSearch,
  quickSearch,
  searchBySku,
  getSearchAnalytics
} from "../controllers/searchController.js";

const router = express.Router();

router.get("/", advancedProductSearch);
router.get("/quick", quickSearch);
router.get("/sku", searchBySku);
router.get("/analytics", getSearchAnalytics);

export default router;
