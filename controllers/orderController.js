import Order from "../models/Order.js";
import { sendOrderNotification } from "../services/telegramService.js";
import { generateDailyReportOnOrder } from "./reportController.js";
import { notifyCustomerOrderStatus } from "../services/telegramService.js";

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

export const getOneOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.menuItem",
      "name price image"
    );
    if (!order) {
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    console.log("📝 Yangi zakaz yaratilmoqda...");
    
    const order = await Order.create(req.body);
    console.log(`✅ Zakaz yaratildi: ${order._id}`);

    try {
      await sendOrderNotification(order);
      console.log("✅ Zakaz haqida Telegram xabar yuborildi");
    } catch (telegramErr) {
      console.error("❌ Telegram xatosi:", telegramErr.message);
    }

    try {
      console.log("📊 Kunlik hisobot yangilanmoqda...");
      await generateDailyReportOnOrder();
      console.log("✅ Kunlik hisobot muvaffaqiyatli yangilandi");
    } catch (reportErr) {
      console.error("❌ Hisobot yaratishda xatolik:", reportErr.message);
    }

    res.status(201).json({
      success: true,
      order,
      message: "✅ Zakaz yaratildi! Kunlik hisobot yangilandi."
    });

  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, paymentId },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    }

    await notifyCustomerOrderStatus(order, status);

    if (status === "ready") {
      await generateDailyReportOnOrder();
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryStatus, courierName, courierPhone } = req.body;
    
    const updateData = { deliveryStatus, courierName, courierPhone };
    if (deliveryStatus === "delivered") {
      updateData.status = "ready";
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    }

    await notifyCustomerOrderStatus(order, deliveryStatus);

    if (deliveryStatus === "delivered") {
      await generateDailyReportOnOrder();
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

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

export const searchOrders = async (req, res) => {
  try {
    const { phone, name } = req.query;

    if (!phone || !name) {
      return res.status(400).json({
        success: false,
        message: "Telefon raqami va ism kiritilishi shart",
      });
    }

    const orders = await Order.find({
      phone: phone.trim(),
      customerName: { $regex: name.trim(), $options: "i" },
    })
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

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    }
    res.json({ success: true, message: "✅ Zakaz o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAllOrders = async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.json({
      success: true,
      message: `✅ Barcha zakazlar o'chirildi (${result.deletedCount} ta)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const result = await Order.deleteMany({ status });
    res.json({
      success: true,
      message: `✅ "${status}" statusli zakazlar o'chirildi (${result.deletedCount} ta)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
      message: `✅ ${days} kundan eski zakazlar o'chirildi (${result.deletedCount} ta)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCompletedOrders = async (req, res) => {
  try {
    const result = await Order.deleteMany({
      $or: [
        { status: "ready" },
        { deliveryStatus: "delivered" }
      ]
    });

    try {
      await generateDailyReportOnOrder();
      console.log("✅ Yakunlangan zakazlar o'chirildi, kunlik hisobot yangilandi");
    } catch (reportErr) {
      console.error("❌ Hisobot yangilashda xatolik:", reportErr.message);
    }

    res.json({
      success: true,
      message: `✅ Yakunlangan zakazlar o'chirildi (${result.deletedCount} ta)\n✅ Kunlik hisobot yangilandi!`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAllOrdersForce = async (req, res) => {
  try {
    const count = await Order.countDocuments();
    const result = await Order.deleteMany({});

    try {
      await generateDailyReportOnOrder();
      console.log("✅ Barcha zakazlar o'chirildi, kunlik hisobot yangilandi");
    } catch (reportErr) {
      console.error("❌ Hisobot yangilashda xatolik:", reportErr.message);
    }

    res.json({
      success: true,
      message: `✅ Barcha ${result.deletedCount} ta zakaz butunlay o'chirildi!\n✅ Kunlik hisobot yangilandi!`,
      deletedCount: result.deletedCount,
      totalBefore: count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};