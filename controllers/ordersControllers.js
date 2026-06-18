import Order from "../models/order.js";

// GET ALL — barcha zakazlar
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE — yangi zakaz yaratish
export const createOrder = async (req, res) => {
  try {
    if (req.body.deliveryType === "delivery" && !req.body.address) {
      return res
        .status(400)
        .json({ message: "Yetkazish uchun manzil kiritilishi shart" });
    }

    const order = await Order.create(req.body);
    res.status(201).json({ message: "Zakaz qabul qilindi ✅", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE STATUS — zakaz holatini yangilash
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Zakaz topilmadi" });
    }

    res.json({ message: "Zakaz holati yangilandi ✅", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE — zakazni o'chirish
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Zakaz topilmadi" });
    }

    res.json({ message: "Zakaz o'chirildi ✅", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
