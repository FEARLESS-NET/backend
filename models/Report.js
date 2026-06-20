import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
    },
    period: {
      type: String,
      required: true, // "2024-01-15" yoki "2024-W03" yoki "2024-01"
    },
    data: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalReservations: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 },
      ordersByStatus: {
        pending: { type: Number, default: 0 },
        confirmed: { type: Number, default: 0 },
        preparing: { type: Number, default: 0 },
        ready: { type: Number, default: 0 },
        cancelled: { type: Number, default: 0 },
      },
      ordersByDeliveryType: {
        "dine-in": { type: Number, default: 0 },
        takeaway: { type: Number, default: 0 },
        delivery: { type: Number, default: 0 },
      },
      topItems: [
        {
          name: String,
          quantity: Number,
          revenue: Number,
        },
      ],
      topCustomers: [
        {
          name: String,
          phone: String,
          orders: Number,
          totalSpent: Number,
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
export default Report;