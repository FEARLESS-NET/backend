import Order from "../models/Order.js";
import { sendOrderNotification } from "../services/telegramService.js";

// Barcha zakazlar
export const getOrders = async (req, res) => {
  try {
    const { status, deliveryStatus } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (deliveryStatus) filter.deliveryStatus = deliveryStatus;

    const orders = await Order.find(filter)
      .populate("items.menuItem", "name price")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bitta zakaz
export const getOneOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.menuItem",
      "name price image"
    );
    if (!order)
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Yangi zakaz yaratish
export const createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // ✅ Faqat Telegram xabar
    await sendOrderNotification(order);

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// To'lov holatini yangilash
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, paymentId },
      { new: true }
    );
    if (!order)
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Zakaz statusini yangilash
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order)
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── ✅ YETKAZIB BERISH HOLATINI YANGILASH ──────────────────────────────
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryStatus, deliveryTime, courierName, courierPhone } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        deliveryStatus, 
        deliveryTime, 
        courierName, 
        courierPhone,
        // Agar deliveryStatus "delivered" bo'lsa, statusni ham "ready" qilamiz
        ...(deliveryStatus === "delivered" && { status: "ready" })
      },
      { new: true, runValidators: true }
    );
    if (!order)
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── ✅ ZAKAZNI TELEFON RAQAM BO'YICHA QIDIRISH ──────────────────────────
export const getOrderByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const orders = await Order.find({ phone })
      .populate("items.menuItem", "name price image")
      .sort({ createdAt: -1 });
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    }
    
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Zakazni o'chirish
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    res.json({ success: true, message: "Zakaz o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── BARCHA ZAKAZLARNI O'CHIRISH ──────────────────────────────────────────
export const deleteAllOrders = async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.json({
      success: true,
      message: `Barcha zakazlar o'chirildi (${result.deletedCount} ta)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── STATUS BO'YICHA ZAKAZLARNI O'CHIRISH ────────────────────────────────
export const deleteOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const result = await Order.deleteMany({ status });
    res.json({
      success: true,
      message: `"${status}" statusli zakazlar o'chirildi (${result.deletedCount} ta)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ESKI ZAKAZLARNI O'CHIRISH ────────────────────────────────────────────
export const deleteOldOrders = async (req, res) => {
  try {
    const { days } = req.params;
    const date = new Date();
    date.setDate(date.getDate() - parseInt(days));

    const result = await Order.deleteMany({
      createdAt: { $lt: date },
    });

    res.json({
      success: true,
      message: `${days} kundan eski zakazlar o'chirildi (${result.deletedCount} ta)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};