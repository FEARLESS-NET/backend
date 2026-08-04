/**
 * CHEK ROUTER
 * /receipt/:orderId/html – HTML chek, /receipt/:orderId/download – yuklab olish.
 */
import express from "express";
import { getReceiptHTML, downloadReceiptPDF } from "../controllers/receiptController.js";

const router = express.Router();

router.get("/receipt/:orderId/html", getReceiptHTML);
router.get("/receipt/:orderId/download", downloadReceiptPDF);

export default router;