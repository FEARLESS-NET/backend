import express from 'express';
import {
  createClickPayment,
  createPaymePayment,
  createUzumbankPayment,
  paymentWebhook,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/payment/click', createClickPayment);
router.post('/payment/payme', createPaymePayment);
router.post('/payment/uzumbank', createUzumbankPayment);
router.post('/payment/webhook', paymentWebhook);

export default router;