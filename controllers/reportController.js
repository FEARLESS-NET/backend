import Order from "../models/Order.js";
import Reservation from "../models/Reservation.js";
import Report from "../models/Report.js";

// ─── HISOBOT YARATISH ──────────────────────────────────────────────────────
const generateReport = async (type, period) => {
  try {
    let startDate, endDate;

    if (type === "daily") {
      startDate = new Date(period);
      endDate = new Date(period);
      endDate.setDate(endDate.getDate() + 1);
    } else if (type === "weekly") {
      const [year, week] = period.split("-W").map(Number);
      const firstDay = new Date(year, 0, 1);
      const days = (week - 1) * 7;
      startDate = new Date(firstDay.setDate(firstDay.getDate() + days));
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
    } else if (type === "monthly") {
      const [year, month] = period.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 1);
    }

    // Orders
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lt: endDate },
    });

    const reservations = await Reservation.find({
      createdAt: { $gte: startDate, $lt: endDate },
    });

    // Statistika
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const totalReservations = reservations.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status bo'yicha
    const ordersByStatus = {
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };

    // Delivery type bo'yicha
    const ordersByDeliveryType = {
      "dine-in": orders.filter((o) => o.deliveryType === "dine-in").length,
      takeaway: orders.filter((o) => o.deliveryType === "takeaway").length,
      delivery: orders.filter((o) => o.deliveryType === "delivery").length,
    };

    // Eng ko'p sotilgan taomlar
    const itemMap = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { quantity: 0, revenue: 0 };
        }
        itemMap[item.name].quantity += item.quantity;
        itemMap[item.name].revenue += item.price * item.quantity;
      });
    });

    const topItems = Object.entries(itemMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Eng ko'p zakaz qilgan mijozlar
    const customerMap = {};
    orders.forEach((order) => {
      const key = order.phone;
      if (!customerMap[key]) {
        customerMap[key] = { name: order.customerName, phone: order.phone, orders: 0, totalSpent: 0 };
      }
      customerMap[key].orders += 1;
      customerMap[key].totalSpent += order.totalPrice || 0;
    });

    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      type,
      period,
      data: {
        totalOrders,
        totalRevenue,
        totalReservations,
        averageOrderValue,
        ordersByStatus,
        ordersByDeliveryType,
        topItems,
        topCustomers,
      },
    };
  } catch (error) {
    console.error("Report generation error:", error);
    throw error;
  }
};

// ─── HISOBOT YARATISH VA SAQLASH ──────────────────────────────────────────
export const createReport = async (req, res) => {
  try {
    const { type } = req.params; // daily, weekly, monthly
    const now = new Date();

    let period;
    if (type === "daily") {
      period = now.toISOString().split("T")[0];
    } else if (type === "weekly") {
      const year = now.getFullYear();
      const week = Math.ceil(((now - new Date(year, 0, 1)) / 86400000 + 1) / 7);
      period = `${year}-W${String(week).padStart(2, "0")}`;
    } else if (type === "monthly") {
      period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    } else {
      return res.status(400).json({ success: false, message: "Noto'g'ri tur" });
    }

    // Eski hisobotni o'chirish (agar mavjud bo'lsa)
    await Report.findOneAndDelete({ type, period });

    // Yangi hisobot yaratish
    const reportData = await generateReport(type, period);
    const report = await Report.create(reportData);

    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── BARCHA HISOBOTLARNI OLISH ────────────────────────────────────────────
export const getReports = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    filter.isActive = true;

    const reports = await Report.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── BIR HISOBOTNI OLISH ──────────────────────────────────────────────────
export const getOneReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Hisobot topilmadi" });
    }
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── HISOBOTNI O'CHIRISH (RUCHNOY TOZALASH) ──────────────────────────────
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Hisobot topilmadi" });
    }
    res.json({ success: true, message: "Hisobot o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── BARCHA HISOBOTLARNI O'CHIRISH (RUCHNOY TOZALASH) ────────────────────
export const deleteAllReports = async (req, res) => {
  try {
    await Report.deleteMany({});
    res.json({ success: true, message: "Barcha hisobotlar o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── HISOBOTLARNI AVTOMATIK YARATISH ──────────────────────────────────────
export const autoGenerateReports = async () => {
  try {
    const now = new Date();
    const types = ["daily", "weekly", "monthly"];

    for (const type of types) {
      let period;
      if (type === "daily") {
        period = now.toISOString().split("T")[0];
      } else if (type === "weekly") {
        const year = now.getFullYear();
        const week = Math.ceil(((now - new Date(year, 0, 1)) / 86400000 + 1) / 7);
        period = `${year}-W${String(week).padStart(2, "0")}`;
      } else if (type === "monthly") {
        period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      }

      // Eski hisobotni o'chirish
      await Report.findOneAndDelete({ type, period });

      // Yangi hisobot yaratish
      const reportData = await generateReport(type, period);
      await Report.create(reportData);
      console.log(`✅ ${type} hisobot yaratildi: ${period}`);
    }
  } catch (error) {
    console.error("❌ Auto report error:", error);
  }
};