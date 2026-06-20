import express from "express";
import {
  getReservations,
  getOneReservation,
  createReservation,
  updateReservation,
  cancelReservation,
  getNearbyReservations, // ✅ Yangi
} from "../controllers/reservationController.js";

const router = express.Router();

router.get("/reservations", getReservations);        // ?date=2024-12-01&status=pending&diningArea=main_hall
router.get("/reservations/nearby", getNearbyReservations); // ✅ Lokatsiya bo'yicha yaqin bronlar
router.get("/reservations/:id", getOneReservation);
router.post("/reservations", createReservation);
router.put("/reservations/:id", updateReservation);
router.patch("/reservations/:id/cancel", cancelReservation);

export default router;