import Reservation from "../models/reservation.js";
import Table from "../models/table.js";

// GET ALL — barcha bronlar (stol ma'lumoti bilan)
export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("tableId", "number capacity location")
      .sort({ createdAt: -1 });
    res.json({ reservations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE — yangi bron yaratish va stolni band qilish
export const createReservation = async (req, res) => {
  try {
    const table = await Table.findById(req.body.tableId);
    if (!table) {
      return res.status(404).json({ message: "Stol topilmadi" });
    }
    if (!table.isAvailable) {
      return res.status(400).json({ message: "Bu stol allaqachon band" });
    }

    const reservation = await Reservation.create(req.body);
    table.isAvailable = false;
    await table.save();

    res.status(201).json({ message: "Bron qabul qilindi ✅", reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE — bron holatini yangilash (bekor qilinsa stol bo'shaydi)
export const updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: "Bron topilmadi" });
    }

    if (req.body.status === "cancelled" && reservation.tableId) {
      await Table.findByIdAndUpdate(reservation.tableId, { isAvailable: true });
    }

    res.json({ message: "Bron yangilandi ✅", reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE — bronni o'chirish va stolni bo'shatish
export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Bron topilmadi" });
    }

    if (reservation.tableId) {
      await Table.findByIdAndUpdate(reservation.tableId, { isAvailable: true });
    }

    res.json({ message: "Bron o'chirildi ✅", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
