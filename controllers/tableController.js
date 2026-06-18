import Table from "../models/Table.js";
import Reservation from "../models/Reservation.js";

// Barcha stollarni olish (bo'sh/band statistika bilan)
export const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 });

    const total = tables.length;
    const available = tables.filter((t) => t.isAvailable).length;
    const booked = total - available;

    res.json({
      success: true,
      stats: { total, available, booked },
      tables,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bitta stol
export const getOneTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table)
      return res.status(404).json({ success: false, message: "Stol topilmadi" });
    res.json({ success: true, table });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Yangi stol qo'shish
export const createTable = async (req, res) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json({ success: true, table });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Stolni yangilash
export const updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!table)
      return res.status(404).json({ success: false, message: "Stol topilmadi" });
    res.json({ success: true, table });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Stolni o'chirish
export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table)
      return res.status(404).json({ success: false, message: "Stol topilmadi" });
    res.json({ success: true, message: "Stol o'chirildi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ma'lum sana va vaqtda bo'sh stollarni olish
export const getAvailableTables = async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res
        .status(400)
        .json({ success: false, message: "Sana va vaqt kiritilishi shart" });
    }

    // O'sha sana va vaqtda bron qilingan stollar
    const bookedReservations = await Reservation.find({
      date,
      time,
      status: { $ne: "cancelled" },
    }).select("tableId");

    const bookedTableIds = bookedReservations.map((r) => r.tableId.toString());

    const allTables = await Table.find().sort({ number: 1 });

    const tablesWithStatus = allTables.map((t) => ({
      ...t.toObject(),
      isBookedAtTime: bookedTableIds.includes(t._id.toString()),
    }));

    res.json({ success: true, tables: tablesWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
