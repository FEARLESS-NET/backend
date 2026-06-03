import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nom kiritilishi shart"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Narx kiritilishi shart"],
      min: [0, "Narx manfiy bo'lmasligi kerak"],
    },
    retsept: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ Model qayta yuklanishining oldini olish (nodemon uchun muhim)
const Menu = mongoose.models.Menu || mongoose.model("Menu", menuSchema);

export default Menu;
