import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
    },
    name: {
      type: String,
      required: [true, "Taom nomi kiritilishi shart"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Narx kiritilishi shart"],
      min: [0, "Narx manfiy bo'lmasligi kerak"],
    },
    quantity: {
      type: Number,
      required: [true, "Miqdor kiritilishi shart"],
      min: [1, "Miqdor 1 dan kichik bo'lmasligi kerak"],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Ism kiritilishi shart"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Telefon raqami kiritilishi shart"],
      trim: true,
    },
    deliveryType: {
      type: String,
      enum: ["dine-in", "takeaway", "delivery"],
      default: "dine-in",
    },
    address: {
      type: String,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "Kamida bitta taom tanlanishi kerak",
      },
    },
    totalPrice: {
      type: Number,
      required: [true, "Umumiy narx kiritilishi shart"],
      min: [0, "Umumiy narx manfiy bo'lmasligi kerak"],
    },
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
