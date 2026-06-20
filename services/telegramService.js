import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ─── Asosiy xabar yuboruvchi ───────────────────────────────────────────────
const sendMessage = async (text) => {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.log("⚠️ Telegram sozlanmagan, xabar yuborilmadi");
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
    });
    const data = await res.json();
    if (!data.ok) console.error("❌ Telegram xato:", data.description);
    else console.log("✅ Telegram xabar yuborildi");
  } catch (err) {
    console.error("❌ Telegram yuborishda xato:", err.message);
  }
};

// ─── ORDER bildirishi ──────────────────────────────────────────────────────
export const sendOrderNotification = async (order) => {
  const items = order.items
    .map(
      (i) =>
        `  • ${i.name || "Taom"} x${i.quantity} = ${(
          i.price * i.quantity
        ).toLocaleString()} so'm`
    )
    .join("\n");

  const yuborildi = new Date().toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  let deliveryInfo = "";
  if (order.deliveryType === "dine-in") {
    deliveryInfo = `🪑 Stol: #${order.tableNumber || "Belgilanmagan"}`;
  } else if (order.deliveryType === "delivery") {
    deliveryInfo = `📍 Manzil: ${order.address || "Kiritilmagan"}`;
  } else if (order.deliveryType === "takeaway") {
    deliveryInfo = `🥡 Olib ketish`;
  }

  const typeLabel =
    order.deliveryType === "dine-in"
      ? "🍽 Restoran"
      : order.deliveryType === "delivery"
      ? "🚚 Yetkazish"
      : "🥡 Olib ketish";

  const text =
    `🛒 <b>🔥 YANGI ZAKAZ!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 Mijoz: ${order.customerName}\n` +
    `📞 Tel: ${order.phone}\n` +
    `📦 Taomlar:\n${items}\n` +
    `💰 Jami: ${order.totalPrice.toLocaleString()} so'm\n` +
    `🚚 Turi: ${typeLabel}\n` +
    (deliveryInfo ? `${deliveryInfo}\n` : "") +
    (order.note ? `📝 Izoh: ${order.note}\n` : "") +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏱ Yuborildi: ${yuborildi}`;

  await sendMessage(text);
};

// ─── RESERVATION bildirishi ────────────────────────────────────────────────
export const sendReservationNotification = async (reservation, tableNumber) => {
  const yuborildi = new Date().toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const diningAreaMap = {
    main_hall: "🏛 Asosiy zal",
    terrace: "🌿 Terassa",
    vip_room: "👑 VIP xona",
    garden: "🌳 Bog'",
  };
  const diningAreaText =
    diningAreaMap[reservation.diningArea] || reservation.diningArea;

  const text =
    `📅 <b>📌 YANGI BRON!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 Mijoz: ${reservation.customerName}\n` +
    `📞 Tel: ${reservation.phone}\n` +
    `🪑 Stol: #${tableNumber}\n` +
    `👥 Mehmonlar: ${reservation.guestCount} kishi\n` +
    `📆 Sana: ${reservation.date}\n` +
    `🕐 Vaqt: ${reservation.time}\n` +
    `📍 Hudud: ${diningAreaText}\n` +
    (reservation.note ? `📝 Izoh: ${reservation.note}\n` : "") +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏱ Yuborildi: ${yuborildi}`;

  await sendMessage(text);
};