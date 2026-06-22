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
    tableNumber: {
      type: Number,
      default: null,
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
    paymentMethod: {
      type: String,
      enum: ['cash', 'click', 'payme', 'uzumbank'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentId: {
      type: String,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'preparing', 'on_the_way', 'delivered'],
      default: 'pending',
    },
    deliveryTime: {
      type: String,
      default: null,
    },
    courierName: {
      type: String,
      default: null,
    },
    courierPhone: {
      type: String,
      default: null,
    },
    // ✅ Yangi: Telegram ID (mijozga xabar yuborish uchun)
    telegramId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ location: "2dsphere" });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;