import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Ism kiritilishi shart"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Telefon raqam kiritilishi shart"],
      trim: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: [true, "Stol tanlanishi shart"],
    },
    date: {
      type: String,
      required: [true, "Sana kiritilishi shart"],
    },
    time: {
      type: String,
      required: [true, "Vaqt kiritilishi shart"],
    },
    guestCount: {
      type: Number,
      required: [true, "Mehmonlar soni kiritilishi shart"],
      min: [1, "Kamida 1 mehmon bo'lishi kerak"],
    },
    // ✅ Lokatsiya (location) qo'shildi
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        index: "2dsphere",
      },
    },
    // ✅ Dine-in uchun qo'shimcha maydon
    diningArea: {
      type: String,
      enum: ["main_hall", "terrace", "vip_room", "garden"],
      default: "main_hall",
    },
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Lokatsiya indeksi
reservationSchema.index({ location: "2dsphere" });

const Reservation = mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema);

export default Reservation;