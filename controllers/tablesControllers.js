import Table from "../models/table.js";

const buildStats = (tables) => ({
  total: tables.length,
  available: tables.filter((t) => t.isAvailable).length,
  booked: tables.filter((t) => !t.isAvailable).length,
});

// GET ALL — barcha stollar va statistika
export const getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
    res.json({ tables, stats: buildStats(tables) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE — yangi stol qo'shish
export const createTable = async (req, res) => {
  try {
    const exists = await Table.findOne({ number: req.body.number });
    if (exists) {
      return res.status(400).json({ message: "Bu raqamli stol allaqachon mavjud" });
    }

    const table = await Table.create(req.body);
    res.status(201).json({ message: "Yangi stol qo'shildi ✅", table });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE — stolni yangilash (isAvailable toggle ham shu yerda)
export const updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!table) {
      return res.status(404).json({ message: "Stol topilmadi" });
    }

    res.json({ message: "Stol yangilandi ✅", table });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE — stolni o'chirish
export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);

    if (!table) {
      return res.status(404).json({ message: "Stol topilmadi" });
    }

    res.json({ message: "Stol o'chirildi ✅", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
