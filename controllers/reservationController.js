import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";
import { sendReservationNotification } from "../services/telegramService.js";

export const getReservations = async (req, res) => {
  try {
    const { date, status, diningArea } = req.query;
    const filter = {};
    if (date) filter.date = date;
    if (status) filter.status = status;
    if (diningArea) filter.diningArea = diningArea;

    const reservations = await Reservation.find(filter)
      .populate("tableId", "number capacity location")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reservations.length, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

export const createReservation = async (req, res) => {
  try {
    const { tableId, date, time, guestCount, location, diningArea } = req.body;

    const table = await Table.findById(tableId);
    if (!table)
      return res.status(404).json({ success: false, message: "Stol topilmadi" });

    if (guestCount > table.capacity) {
      return res.status(400).json({
        success: false,
        message: `Bu stol faqat ${table.capacity} kishilik`,
      });
    }

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

    let locationData = location || { type: "Point", coordinates: [0, 0] };
    if (location && location.coordinates) {
      locationData = {
        type: "Point",
        coordinates: location.coordinates
      };
    }

    const reservationData = {
      ...req.body,
      location: locationData,
      diningArea: diningArea || "main_hall",
    };

    const reservation = await Reservation.create(reservationData);

    await sendReservationNotification(reservation, table.number);

    res.status(201).json({ success: true, reservation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

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

export const getNearbyReservations = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({
        success: false,
        message: "Koordinatalar kiritilishi shart (lng, lat)",
      });
    }

    const reservations = await Reservation.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
      status: { $ne: "cancelled" },
    }).populate("tableId", "number capacity location");

    res.json({ success: true, count: reservations.length, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCompletedReservations = async (req, res) => {
  try {
    const result = await Reservation.deleteMany({
      status: { $in: ["confirmed", "cancelled"] }
    });

    res.json({
      success: true,
      message: `✅ Yakunlangan bronlar o'chirildi (${result.deletedCount} ta)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAllReservationsForce = async (req, res) => {
  try {
    const count = await Reservation.countDocuments();
    const result = await Reservation.deleteMany({});
    
    res.json({
      success: true,
      message: `✅ Barcha ${result.deletedCount} ta bron butunlay o'chirildi!`,
      deletedCount: result.deletedCount,
      totalBefore: count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};