import mongoose from "mongoose";

// ✅ Mijoz saytda "Telegram orqali ulanish" tugmasini bosganda shu yerda
// vaqtinchalik token yaratiladi. Mijoz botga /start <token> orqali kirganda,
// bot shu tokenga mijozning telegramId'sini yozadi. Sayt esa shu tokenni
// vaqti-vaqti bilan tekshirib (polling), telegramId kelganda uni localStorage'ga saqlaydi.
// ⏱ 10 daqiqadan keyin token avtomatik o'chadi (ishlatilmagan/eskirgan tokenlar uchun).
const telegramLinkSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  telegramId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 600 soniya = 10 daqiqa
});

const TelegramLink =
  mongoose.models.TelegramLink || mongoose.model("TelegramLink", telegramLinkSchema);

export default TelegramLink;