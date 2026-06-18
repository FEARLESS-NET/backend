import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: [true, "Stol raqami kiritilishi shart"],
      unique: true,
      min: [1, "Stol raqami 1 dan kichik bo'lmasligi kerak"],
    },
    capacity: {
      type: Number,
      required: [true, "Sig'im kiritilishi shart"],
      min: [1, "Sig'im 1 dan kichik bo'lmasligi kerak"],
    },
    location: {
      type: String,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Table = mongoose.models.Table || mongoose.model("Table", tableSchema);

export default Table;
