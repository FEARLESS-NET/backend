import express from "express";
import {
  getReservations,
  getOneReservation,
  createReservation,
  updateReservation,
  cancelReservation,
} from "../controllers/reservationController.js";

const router = express.Router();

router.get("/reservations", getReservations);        // ?date=2024-12-01&status=pending
router.get("/reservations/:id", getOneReservation);
router.post("/reservations", createReservation);
router.put("/reservations/:id", updateReservation);
router.patch("/reservations/:id/cancel", cancelReservation);

export default router;
