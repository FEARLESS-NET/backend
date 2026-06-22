import express from "express";
import {
  getReports,
  getOneReport,
  deleteReport,
  deleteAllReports,
  resetDailyReport,
  deleteCompletedOrdersAndUpdateDaily,
  deleteCompletedReservationsAndUpdateDaily,
} from "../controllers/reportController.js";

const router = express.Router();

// ─── O'QISH ─────────────────────────────────────────────────────────────
router.get("/reports", getReports);
router.get("/reports/:id", getOneReport);

// ─── ✅ KUNLIK HISOBOTNI 0 GA TIKLAYDI ──────────────────────────────────
router.post("/reports/reset", resetDailyReport);

// ─── ✅ YAKUNLANGANLARNI O'CHIRISH + KUNLIK HISOBOTNI YANGILASH ────────
router.post("/reports/delete-completed-orders", deleteCompletedOrdersAndUpdateDaily);
router.post("/reports/delete-completed-reservations", deleteCompletedReservationsAndUpdateDaily);

// ─── O'CHIRISH ──────────────────────────────────────────────────────────
router.delete("/reports/:id", deleteReport);
router.delete("/reports", deleteAllReports);

export default router;