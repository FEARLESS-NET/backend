import Order from "../models/Order.js";

// ─── Click to'lov tizimi ───────────────────────────────────────────────────
export const createClickPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
    const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID;

    if (!CLICK_SERVICE_ID || !CLICK_MERCHANT_ID) {
      return res
        .status(500)
        .json({ success: false, message: "Click sozlamalari topilmadi" });
    }

    const paymentUrl = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${amount}&transaction_param=${orderId}`;

    res.json({
      success: true,
      paymentUrl,
      message: "Click to'lov linki yaratildi",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Payme to'lov tizimi ───────────────────────────────────────────────────
export const createPaymePayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID;

    if (!PAYME_MERCHANT_ID) {
      return res
        .status(500)
        .json({ success: false, message: "Payme sozlamalari topilmadi" });
    }

    const paymentUrl = `https://checkout.paycom.uz/${Buffer.from(
      `m=${PAYME_MERCHANT_ID};ac.order_id=${orderId};a=${amount * 100}`
    ).toString("base64")}`;

    res.json({
      success: true,
      paymentUrl,
      message: "Payme to'lov linki yaratildi",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UzumBank to'lov tizimi ───────────────────────────────────────────────
export const createUzumbankPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    const UZUMBANK_MERCHANT_ID = process.env.UZUMBANK_MERCHANT_ID;

    if (!UZUMBANK_MERCHANT_ID) {
      return res
        .status(500)
        .json({ success: false, message: "UzumBank sozlamalari topilmadi" });
    }

    const paymentUrl = `https://pay.uzumbank.uz/pay/${UZUMBANK_MERCHANT_ID}?amount=${amount}&order=${orderId}`;

    res.json({
      success: true,
      paymentUrl,
      message: "UzumBank to'lov linki yaratildi",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── To'lov Webhook (barcha tizimlar uchun) ───────────────────────────────
export const paymentWebhook = async (req, res) => {
  try {
    const { orderId, status, transactionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Zakaz topilmadi" });
    }

    order.paymentStatus = status === "paid" ? "paid" : "failed";
    if (transactionId) order.paymentId = transactionId;
    await order.save();

    res.json({ success: true, message: "To'lov holati yangilandi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
