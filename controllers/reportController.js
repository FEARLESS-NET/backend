import Order from "../models/Order.js";
import Reservation from "../models/Reservation.js";
import Report from "../models/Report.js";
import { sendResetNotification } from "../services/telegramService.js";

// ─── KUNLIK SANANI OLISH ──────────────────────────────────────────────────
const getDailyDateRange = () => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

// ─── HISOBOT NOMERINI OLISH ────────────────────────────────────────────────
const getNextReportNumber = async () => {
  const lastReport = await Report.findOne().sort({ reportNumber: -1 });
  return lastReport ? lastReport.reportNumber + 1 : 1;
};

// ─── ✅ KUNLIK HISOBOT MA'LUMOTLARINI HISOBLASH ──────────────────────────
const generateDailyReport = async () => {
  try {
    const { startDate, endDate } = getDailyDateRange();

    console.log(`📊 Kunlik hisobot hisoblanmoqda...`);
    console.log(`   📅 Davr: ${startDate.toISOString()} - ${endDate.toISOString()}`);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const reservations = await Reservation.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    console.log(`   📦 Zakazlar: ${orders.length} ta`);
    console.log(`   📋 Bronlar: ${reservations.length} ta`);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const totalReservations = reservations.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus = {
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };

    const ordersByDeliveryType = {
      "dine-in": orders.filter((o) => o.deliveryType === "dine-in").length,
      takeaway: orders.filter((o) => o.deliveryType === "takeaway").length,
      delivery: orders.filter((o) => o.deliveryType === "delivery").length,
    };

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

    const period = startDate.toISOString().split("T")[0];

    return {
      type: "daily",
      period,
      startDate,
      endDate,
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
    console.error("Daily report generation error:", error);
    throw error;
  }
};

// ─── ✅ KUNLIK HISOBOTNI YANGILASH ────────────────────────────────────────
// ❌ TELEGRAMGA XABAR YUBORILMAYDI (faqat bazaga yozadi)
const upsertDailyReport = async () => {
  const reportData = await generateDailyReport();

  let report = await Report.findOne({ type: "daily", period: reportData.period });

  if (report) {
    report.data = reportData.data;
    report.startDate = reportData.startDate;
    report.endDate = reportData.endDate;
    await report.save();
    console.log(`✅ Kunlik hisobot yangilandi (joriy: ${reportData.data.totalOrders} zakaz)`);
  } else {
    const reportNumber = await getNextReportNumber();
    report = await Report.create({
      ...reportData,
      uniqueId: `daily-${Date.now()}`,
      reportNumber,
    });
    console.log(`✅ Yangi kunlik hisobot yaratildi (№${reportNumber})`);
  }

  return report;
};

// ─── ✅ KUNLIK HISOBOTNI 0 DAN YARATISH (RESET UCHUN) ──────────────────────
const createZeroDailyReport = async () => {
  const { startDate, endDate } = getDailyDateRange();
  const reportNumber = await getNextReportNumber();
  const period = startDate.toISOString().split("T")[0];

  return await Report.create({
    reportNumber,
    type: "daily",
    period,
    startDate,
    endDate,
    uniqueId: `daily-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    data: {
      totalOrders: 0,
      totalRevenue: 0,
      totalReservations: 0,
      averageOrderValue: 0,
      ordersByStatus: {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        cancelled: 0,
      },
      ordersByDeliveryType: {
        "dine-in": 0,
        takeaway: 0,
        delivery: 0,
      },
      topItems: [],
      topCustomers: [],
    },
    isActive: true,
  });
};

// ─── ✅ ZAKAZ/BRON YARATILGANDA — KUNLIK HISOBOTNI YANGILAYDI ────────────
// ❌ TELEGRAMGA XABAR YUBORILMAYDI (faqat bazaga yozadi)
export const generateDailyReportOnOrder = async () => {
  try {
    console.log("📊 ===== KUNLIK HISOBOT YANGILANMOQDA =====");
    await upsertDailyReport();
    console.log("✅ Kunlik hisobot yangilandi (Telegramga xabar yuborilmadi)");
  } catch (error) {
    console.error("❌ Hisobot yaratishda xatolik:", error);
    throw error;
  }
};

// ─── ✅ KUNLIK HISOBOTNI 0 GA TIKLAYDI ────────────────────────────────────
// ✅ TELEGRAMGA HISOBOT XABARI KELADI (RESET BOSILGANDA)
export const resetDailyReport = async (req, res) => {
  try {
    console.log("🔄 ===== KUNLIK HISOBOT 0 GA TIKLANMOQDA =====");

    // ✅ RESET QILISH OLDIDAGI MA'LUMOTLARNI OLAMIZ
    const beforeReset = await generateDailyReport();
    console.log(`📊 Reset oldidagi ma'lumotlar: ${beforeReset.data.totalOrders} zakaz, ${beforeReset.data.totalRevenue} so'm`);

    // 1. Eski hisobotni o'chirish
    const deleted = await Report.deleteMany({ type: "daily" });
    console.log(`🗑 ${deleted.deletedCount} ta eski kunlik hisobot o'chirildi`);

    // 2. 0 hisobot yaratish
    const zeroReport = await createZeroDailyReport();
    console.log(`✅ Yangi 0 kunlik hisobot yaratildi (№${zeroReport.reportNumber})`);

    // 3. ✅ RESET HAQIDA XABAR YUBORISH (kunlik daromad va zakazlar bilan)
    try {
      await sendResetNotification(beforeReset);
      console.log(`✅ Reset haqida Telegramga xabar yuborildi`);
    } catch (telegramErr) {
      console.warn('⚠️ Telegram xabar yuborilmadi:', telegramErr.message);
    }

    res.json({
      success: true,
      message: `✅ Kunlik hisobot 0 ga tiklandi!`,
      deletedCount: deleted.deletedCount,
      report: zeroReport,
      beforeReset: beforeReset.data,
    });

  } catch (error) {
    console.error('❌ Reset xatosi:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Reset qilishda xatolik yuz berdi'
    });
  }
};

// ─── YAKUNLANGAN ZAKAZLARNI O'CHIRISH ──────────────────────────────────
export const deleteCompletedOrdersAndUpdateDaily = async (req, res) => {
  try {
    console.log("🔄 ===== YAKUNLANGAN ZAKAZLAR O'CHIRILMOQDA =====");

    const result = await Order.deleteMany({
      $or: [
        { status: "ready" },
        { deliveryStatus: "delivered" }
      ]
    });
    console.log(`🗑 ${result.deletedCount} ta yakunlangan zakaz o'chirildi`);

    await upsertDailyReport();
    console.log(`✅ Kunlik hisobot yangilandi (Telegramga xabar yuborilmadi)`);

    res.json({
      success: true,
      message: `✅ Yakunlangan zakazlar o'chirildi (${result.deletedCount} ta)!\n✅ Kunlik hisobot yangilandi!`,
      deletedCount: result.deletedCount,
    });

  } catch (error) {
    console.error('❌ Xatolik:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Xatolik yuz berdi'
    });
  }
};

// ─── YAKUNLANGAN BRONLARNI O'CHIRISH ──────────────────────────────────
export const deleteCompletedReservationsAndUpdateDaily = async (req, res) => {
  try {
    console.log("🔄 ===== YAKUNLANGAN BRONLAR O'CHIRILMOQDA =====");

    const result = await Reservation.deleteMany({
      status: { $in: ["confirmed", "cancelled"] }
    });
    console.log(`🗑 ${result.deletedCount} ta yakunlangan bron o'chirildi`);

    await upsertDailyReport();
    console.log(`✅ Kunlik hisobot yangilandi (Telegramga xabar yuborilmadi)`);

    res.json({
      success: true,
      message: `✅ Yakunlangan bronlar o'chirildi (${result.deletedCount} ta)!\n✅ Kunlik hisobot yangilandi!`,
      deletedCount: result.deletedCount,
    });

  } catch (error) {
    console.error('❌ Xatolik:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Xatolik yuz berdi'
    });
  }
};

// ─── BARCHA HISOBOTLARNI OLISH ────────────────────────────────────────────
export const getReports = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const reports = await Report.find({ type: "daily" })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: reports.length,
      reports,
      total: await Report.countDocuments({ type: "daily" })
    });
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

// ─── HISOBOTNI O'CHIRISH ──────────────────────────────────────────────────
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Hisobot topilmadi" });
    }
    res.json({
      success: true,
      message: `✅ Hisobot №${report.reportNumber} o'chirildi!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── BARCHA HISOBOTLARNI O'CHIRISH ────────────────────────────────────────
export const deleteAllReports = async (req, res) => {
  try {
    const result = await Report.deleteMany({ type: "daily" });
    res.json({
      success: true,
      message: `✅ Barcha kunlik hisobotlar o'chirildi (${result.deletedCount} ta)!`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};