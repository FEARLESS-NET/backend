// routes/receiptRoutes.js
import express from "express";
import { getReceiptHTML, downloadReceiptPDF } from "../controllers/receiptController.js";

const router = express.Router();

// Modal uchun: chek HTML sini JSON ichida qaytaradi
// GET /receipt/:orderId
router.get("/receipt/:orderId", getReceiptHTML);

// Print/yuklab olish uchun: chek HTML sini to'g'ridan-to'g'ri qaytaradi
// GET /receipt/:orderId/download
router.get("/receipt/:orderId/download", downloadReceiptPDF);

export default router;