import express from "express";
import {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
} from "../controllers/reservationsControllers.js";

const router = express.Router();

router.get("/reservations", getReservations);          // GET    /api/v1/reservations
router.post("/reservations", createReservation);       // POST   /api/v1/reservations
router.put("/reservations/:id", updateReservation);    // PUT    /api/v1/reservations/:id
router.delete("/reservations/:id", deleteReservation); // DELETE /api/v1/reservations/:id

export default router;
