import mongoose from "mongoose";

const telegramLinkSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  telegramId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

const TelegramLink =
  mongoose.models.TelegramLink || mongoose.model("TelegramLink", telegramLinkSchema);

export default TelegramLink;