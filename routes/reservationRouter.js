import express from "express";
import {
  getReservations,
  getOneReservation,
  createReservation,
  updateReservation,
  cancelReservation,        // ✅ BU EXPORT QILINGAN
  getNearbyReservations,
  deleteCompletedReservations,
  deleteAllReservationsForce,
} from "../controllers/reservationController.js";

const router = express.Router();

router.get("/reservations", getReservations);
router.get("/reservations/nearby", getNearbyReservations);
router.get("/reservations/:id", getOneReservation);
router.post("/reservations", createReservation);
router.put("/reservations/:id", updateReservation);
router.patch("/reservations/:id/cancel", cancelReservation);  // ✅ BU ENDI ISHLAYDI
router.delete("/reservations/force", deleteAllReservationsForce);
router.delete("/reservations/completed", deleteCompletedReservations);

export default router;