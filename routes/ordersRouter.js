import express from "express";
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/ordersControllers.js";

const router = express.Router();

router.get("/orders", getOrders);                      // GET    /api/v1/orders
router.post("/orders", createOrder);                   // POST   /api/v1/orders
router.patch("/orders/:id/status", updateOrderStatus); // PATCH  /api/v1/orders/:id/status
router.delete("/orders/:id", deleteOrder);             // DELETE /api/v1/orders/:id

export default router;
