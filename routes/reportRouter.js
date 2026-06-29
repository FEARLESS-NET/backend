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

router.get("/reports", getReports);
router.get("/reports/:id", getOneReport);

router.post("/reports/reset", resetDailyReport);

router.post("/reports/delete-completed-orders", deleteCompletedOrdersAndUpdateDaily);
router.post("/reports/delete-completed-reservations", deleteCompletedReservationsAndUpdateDaily);

router.delete("/reports/:id", deleteReport);
router.delete("/reports", deleteAllReports);

export default router;