import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
    required: true,
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const orderSchema = new mongoose.Schema(
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
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "Kamida bitta taom tanlanishi kerak",
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryType: {
      type: String,
      enum: ["delivery", "takeaway", "dine-in"],
      default: "dine-in",
    },
    address: {
      type: String,
      trim: true,
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