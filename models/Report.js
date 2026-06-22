import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
    },
    period: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    uniqueId: {
      type: String,
      unique: true,
      required: true,
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

// ✅ Qo'shimcha indekslar
reportSchema.index({ type: 1, createdAt: -1 });
reportSchema.index({ type: 1, period: 1 });

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
export default Report;