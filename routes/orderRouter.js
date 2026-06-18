import express from "express";
import {
  getOrders,
  getOneOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/orders", getOrders);           // ?status=pending
router.get("/orders/:id", getOneOrder);
router.post("/orders", createOrder);
router.patch("/orders/:id/status", updateOrderStatus);
router.delete("/orders/:id", deleteOrder);

export default router;
