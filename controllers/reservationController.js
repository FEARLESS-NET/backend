import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";
import { sendReservationNotification } from "../services/telegramService.js";

// Barcha bronlar
export const getReservations = async (req, res) => {
  try {
    const { date, status } = req.query;
    const filter = {};
    if (date) filter.date = date;
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .populate("tableId", "number capacity location")
      .sort({ date: 1, time: 1 });

    res.json({ success: true, count: reservations.length, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bitta bron
export const getOneReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate(
      "tableId",
      "number capacity location"
    );
    if (!reservation)
      return res.status(404).json({ success: false, message: "Bron topilmadi" });
    res.json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Yangi bron yaratish
export const createReservation = async (req, res) => {
  try {
    const { tableId, date, time, guestCount } = req.body;

    // Stol mavjudligini tekshirish
    const table = await Table.findById(tableId);
    if (!table)
      return res.status(404).json({ success: false, message: "Stol topilmadi" });

    // Sig'im tekshirish
    if (guestCount > table.capacity) {
      return res.status(400).json({
        success: false,
        message: `Bu stol faqat ${table.capacity} kishilik`,
      });
    }

    // O'sha vaqtda bron qilinganmi?
    const conflict = await Reservation.findOne({
      tableId,
      date,
      time,
      status: { $ne: "cancelled" },
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "Bu stol ushbu sana va vaqtda allaqachon bron qilingan",
      });
    }

    const reservation = await Reservation.create(req.body);

    // Telegram xabar
    await sendReservationNotification(reservation, table.number);

    res.status(201).json({ success: true, reservation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Bronni yangilash (status o'zgartirish)
export const updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("tableId", "number capacity location");

    if (!reservation)
      return res.status(404).json({ success: false, message: "Bron topilmadi" });

    res.json({ success: true, reservation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Bronni bekor qilish
export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!reservation)
      return res.status(404).json({ success: false, message: "Bron topilmadi" });
    res.json({ success: true, message: "Bron bekor qilindi", reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
