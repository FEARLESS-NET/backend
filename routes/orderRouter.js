import express from 'express';
import {
  getOrders,
  getOneOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  updatePaymentStatus,
  updateDeliveryStatus,
  getOrderByPhone,
  searchOrders,
  deleteAllOrders,
  deleteOrdersByStatus,
  deleteOldOrders,
  deleteCompletedOrders,
  deleteAllOrdersForce,
} from '../controllers/orderController.js';

const router = express.Router();

// ─── GET ──────────────────────────────────────────────────────────────────
router.get('/orders/search', searchOrders);
router.get('/orders/phone/:phone', getOrderByPhone);
router.get('/orders', getOrders);
router.get('/orders/:id', getOneOrder);

// ─── POST ─────────────────────────────────────────────────────────────────
router.post('/orders', createOrder);

// ─── PATCH (UPDATE) ──────────────────────────────────────────────────────
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/:id/payment', updatePaymentStatus);
router.patch('/orders/:id/delivery', updateDeliveryStatus);

// ─── DELETE ──────────────────────────────────────────────────────────────
router.delete('/orders/force', deleteAllOrdersForce);
router.delete('/orders/completed', deleteCompletedOrders);
router.delete('/orders/:id', deleteOrder);
router.delete('/orders', deleteAllOrders);
router.delete('/orders/status/:status', deleteOrdersByStatus);
router.delete('/orders/old/:days', deleteOldOrders);

export default router;