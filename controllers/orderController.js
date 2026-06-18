import Order from "../models/Order.js";
import { sendOrderNotification } from "../services/telegramService.js";

// Barcha zakazlar
export const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

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

    // Telegram xabar
    await sendOrderNotification(order);

    res.status(201).json({ success: true, order });
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
