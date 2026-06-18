import dotenv from "dotenv";
dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log("🔍 Telegram sozlamalari tekshirilmoqda...");
console.log("TELEGRAM_TOKEN:", TELEGRAM_TOKEN ? "✅ Mavjud" : "❌ Mavjud emas");
console.log("TELEGRAM_CHAT_ID:", CHAT_ID ? "✅ Mavjud" : "❌ Mavjud emas");

const sendTelegramMessage = async (text) => {
  try {
    if (!TELEGRAM_TOKEN || !CHAT_ID) {
      console.log("⚠️ Telegram sozlamalari topilmadi, xabar yuborilmadi");
      console.log("   TELEGRAM_TOKEN:", TELEGRAM_TOKEN || "❌");
      console.log("   TELEGRAM_CHAT_ID:", CHAT_ID || "❌");
      return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    console.log(`📤 Telegram xabar yuborilmoqda: ${url}`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: "HTML",
      }),
    });
    
    const data = await response.json();
    console.log("📥 Telegram javobi:", data);
    
    if (!data.ok) {
      console.error("❌ Telegram xabar yuborishda xato:", data);
    } else {
      console.log("✅ Telegram xabar yuborildi!");
    }
  } catch (error) {
    console.error("❌ Telegram servis xatosi:", error.message);
  }
};

// Yangi zakaz uchun xabar
export const sendOrderNotification = (order) => {
  console.log("📦 Zakaz xabari tayyorlanmoqda...");
  
  const items = order.items
    .map((i) => `  • ${i.name} x${i.quantity} — ${i.price * i.quantity} so'm`)
    .join("\n");

  const text = `
🛒 <b>YANGI ZAKAZ!</b>

👤 Mijoz: <b>${order.customerName}</b>
📞 Tel: <b>${order.phone}</b>
🚚 Tur: <b>${order.deliveryType === "delivery" ? "Yetkazib berish" : order.deliveryType === "takeaway" ? "Olib ketish" : "Restoranda"}</b>
${order.address ? `📍 Manzil: ${order.address}\n` : ""}
🍽 Taomlar:
${items}

💰 Jami: <b>${order.totalPrice} so'm</b>
${order.note ? `📝 Izoh: ${order.note}` : ""}
⏰ Vaqt: ${new Date().toLocaleString("uz-UZ")}
`;

  console.log("📤 Zakaz xabari yuborilmoqda...");
  return sendTelegramMessage(text);
};

// Yangi bron uchun xabar
export const sendReservationNotification = (reservation, tableNumber) => {
  console.log("📅 Bron xabari tayyorlanmoqda...");
  
  const text = `
📅 <b>YANGI BRON!</b>

👤 Mijoz: <b>${reservation.customerName}</b>
📞 Tel: <b>${reservation.phone}</b>
🪑 Stol: <b>#${tableNumber || "Noma'lum"}</b>
👥 Mehmonlar: <b>${reservation.guestCount} kishi</b>
📆 Sana: <b>${reservation.date}</b>
⏰ Vaqt: <b>${reservation.time}</b>
${reservation.note ? `📝 Izoh: ${reservation.note}` : ""}
🕐 Yuborildi: ${new Date().toLocaleString("uz-UZ")}
`;

  console.log("📤 Bron xabari yuborilmoqda...");
  return sendTelegramMessage(text);
};

// Test funksiyasi
export const testTelegram = async () => {
  console.log("🧪 Telegram test xabari yuborilmoqda...");
  return sendTelegramMessage("✅ Bot ishlayapti! Test xabar");
};