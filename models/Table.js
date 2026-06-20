import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: [true, "Stol raqami kiritilishi shart"],
      unique: true,
    },
    capacity: {
      type: Number,
      required: [true, "Sig'im kiritilishi shart"],
      min: [1, "Sig'im kamida 1 bo'lishi kerak"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    location: {
      type: String,
      trim: true,
      // masalan: "Ichki zal", "Tashqi terassa"
    },
  },
  { timestamps: true }
);

const Table = mongoose.models.Table || mongoose.model("Table", tableSchema);

export default Table;
