import express from "express";
import {
  createReport,
  getReports,
  getOneReport,
  deleteReport,
  deleteAllReports,
} from "../controllers/reportController.js";  // ✅ Yo'l to'g'ri

const router = express.Router();

router.get("/reports", getReports);
router.get("/reports/:id", getOneReport);
router.post("/reports/:type", createReport);
router.delete("/reports/:id", deleteReport);
router.delete("/reports", deleteAllReports);

export default router;