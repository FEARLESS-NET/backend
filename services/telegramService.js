import dotenv from "dotenv";
import fetch from "node-fetch";
import TelegramLink from "../models/TelegramLink.js";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const FRONTEND_URL = (process.env.FRONTEND_URL || "https://qrcode-4-hqdm.onrender.com").replace(/\/$/, "");

const sendMessage = async (text, { chatId = CHAT_ID, replyMarkup } = {}) => {
  if (!BOT_TOKEN || !chatId) {
    console.log("⚠️ Telegram sozlanmagan yoki chat_id yo'q, xabar yuborilmadi");
    return false;
  }
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const body = { chat_id: chatId, text, parse_mode: "HTML" };
    if (replyMarkup) body.reply_markup = replyMarkup;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("❌ Telegram xato:", data.description);
      return false;
    }
    console.log("✅ Telegram xabar yuborildi");
    return true;
  } catch (err) {
    console.error("❌ Telegram yuborishda xato:", err.message);
    return false;
  }
};

const sendLocation = async (latitude, longitude, chatId = CHAT_ID) => {
  if (!BOT_TOKEN || !chatId) return;
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, latitude, longitude }),
    });
    const data = await res.json();
    if (!data.ok) console.error("❌ Telegram lokatsiya xato:", data.description);
    else console.log("✅ Telegram lokatsiya yuborildi");
  } catch (err) {
    console.error("❌ Telegram lokatsiya yuborishda xato:", err.message);
  }
};

// ===== ZAKAZ XABARI (ADMINGA) =====
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
  const [lng, lat] = order.location?.coordinates || [];
  const hasValidCoords = typeof lat === "number" && typeof lng === "number" && !(lat === 0 && lng === 0);

  if (order.deliveryType === "dine-in") {
    const tableLocation = order.tableLocation || "";
    deliveryInfo = `🪑 Stol: #${order.tableNumber || "Belgilanmagan"}${tableLocation ? ` (${tableLocation})` : ""}`;
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

  // ✅ FAQAT LOKATSIYA TUGMASI (agar manzil bo'lsa)
  let replyMarkup = undefined;
  if (order.deliveryType === "delivery" && hasValidCoords) {
    replyMarkup = {
      inline_keyboard: [
        [{ text: "🗺 Xaritada ochish", url: `https://www.google.com/maps?q=${lat},${lng}` }]
      ]
    };
  }

  await sendMessage(text, { replyMarkup });

  if (order.deliveryType === "delivery" && hasValidCoords) {
    await sendLocation(lat, lng);
  }
};

// ===== BRON XABARI (ADMINGA) - FAQAT RESTORAN MANZILI =====
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
  const diningAreaText = diningAreaMap[reservation.diningArea] || reservation.diningArea;

  const text =
    `📅 <b>📌 YANGI BRON!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 Mijoz: ${reservation.customerName}\n` +
    `📞 Tel: ${reservation.phone}\n` +
    `🪑 Stol: #${tableNumber} (${diningAreaText})\n` +
    `👥 Mehmonlar: ${reservation.guestCount} kishi\n` +
    `📆 Sana: ${reservation.date}\n` +
    `🕐 Vaqt: ${reservation.time}\n` +
    (reservation.note ? `📝 Izoh: ${reservation.note}\n` : "") +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏱ Yuborildi: ${yuborildi}`;

  // ✅ FAQAT RESTORAN MANZILI
  const replyMarkup = {
    inline_keyboard: [
      [{ text: "🗺 Restoran manzili", url: "https://maps.app.goo.gl/DtBffyxtB2FRbas48" }]
    ]
  };

  await sendMessage(text, { replyMarkup });
};

// ===== BRON TASDIQLASH XABARI (MIJOZGA) - FAQAT RESTORAN MANZILI =====
export const sendCustomerReservationConfirmation = async (reservation, tableNumber) => {
  if (!reservation.telegramId) {
    console.log("ℹ️ Mijozning telegramId'si yo'q — bron tasdiqlash xabari yuborilmadi");
    return false;
  }

  const diningAreaMap = {
    main_hall: "🏛 Asosiy zal",
    terrace: "🌿 Terassa",
    vip_room: "👑 VIP xona",
    garden: "🌳 Bog'",
  };
  const diningAreaText = diningAreaMap[reservation.diningArea] || reservation.diningArea;

  const text =
    `✅ <b>Broningiz tasdiqlandi!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 Mijoz: ${reservation.customerName}\n` +
    `🪑 Stol: #${tableNumber} (${diningAreaText})\n` +
    `👥 Mehmonlar: ${reservation.guestCount} kishi\n` +
    `📆 Sana: ${reservation.date}\n` +
    `🕐 Vaqt: ${reservation.time}\n` +
    (reservation.note ? `📝 Izoh: ${reservation.note}\n` : "") +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🎉 Sizni shu vaqtda kutamiz!\n\n` +
    `📞 Restoran: +998 90 123 45 67`;

  // ✅ FAQAT RESTORAN MANZILI
  const replyMarkup = {
    inline_keyboard: [
      [{ text: "🗺 Restoran manzili", url: "https://maps.app.goo.gl/DtBffyxtB2FRbas48" }]
    ]
  };

  return sendCustomerMessage(reservation.telegramId, text, replyMarkup);
};

// ===== HISOBOT RESET XABARI - TUGMA YO'Q =====
export const sendResetNotification = async (reportData) => {
  if (!reportData) return false;
  const { period, data = {} } = reportData;

  const topItemsText =
    (data.topItems || [])
      .slice(0, 5)
      .map((item, i) => `  ${i + 1}. ${item.name} — ${item.quantity} dona`)
      .join("\n") || "  Mavjud emas";

  const yuborildi = new Date().toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const text =
    `🔄 <b>📅 KUNLIK HISOBOT RESET QILINDI!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📅 Sana: ${period}\n` +
    `🛒 Zakazlar: ${data.totalOrders || 0}\n` +
    `💰 Daromad: ${(data.totalRevenue || 0).toLocaleString()} so'm\n` +
    `📋 Bronlar: ${data.totalReservations || 0}\n` +
    `📈 O'rtacha chek: ${Math.round(data.averageOrderValue || 0).toLocaleString()} so'm\n` +
    `🔥 Eng ko'p sotilganlar:\n${topItemsText}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏱ Reset vaqti: ${yuborildi}\n` +
    `✅ Hisobot 0 ga tiklandi!` +
    `\n━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 Yangi kun boshlansin! 🚀`;

  // ✅ TUGMA YO'Q
  return sendMessage(text);
};

// ===== MIJOZGA XABAR YUBORISH =====
export const sendCustomerMessage = async (telegramId, text, replyMarkup) => {
  if (!telegramId) {
    console.log("ℹ️ Mijozning telegramId'si yo'q — Telegram orqali xabar yuborilmadi");
    return false;
  }
  return sendMessage(text, { chatId: telegramId, replyMarkup });
};

// ===== ZAKAZ HOLATI XABARI (MIJOZGA) - TUGMA YO'Q =====
export const notifyCustomerOrderStatus = async (order, statusKey) => {
  const orderShort = `#${order._id?.toString().slice(-6) || ""}`;

  const statusTexts = {
    confirmed: `✅ <b>Buyurtmangiz qabul qilindi!</b>\nZakaz ${orderShort} tasdiqlandi.`,
    preparing: `👨‍🍳 <b>Buyurtmangiz tayyorlanmoqda...</b>\nZakaz ${orderShort} oshxonada.`,
    ready: `🎉 <b>Buyurtmangiz tayyor!</b>\nZakaz ${orderShort} tayyor bo'ldi.`,
    on_the_way: `🚚 <b>Kuryer yo'lda!</b>\nZakaz ${orderShort} yetkazilmoqda.`,
    delivered: `✅ <b>Buyurtmangiz yetkazib berildi!</b>\nZakaz ${orderShort} yakunlandi.`,
    cancelled: `❌ <b>Buyurtmangiz bekor qilindi.</b>`,
  };

  const text = statusTexts[statusKey];
  if (!text) return false;

  // ✅ TUGMA YO'Q
  return sendCustomerMessage(order.telegramId, text);
};

// ===== BOT USERNAME OLISH =====
let cachedBotUsername = null;

export const getBotUsername = async () => {
  if (cachedBotUsername) return cachedBotUsername;
  if (!BOT_TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const data = await res.json();
    if (data.ok) {
      cachedBotUsername = data.result.username;
      return cachedBotUsername;
    }
  } catch (err) {
    console.error("❌ Bot username olishda xato:", err.message);
  }
  return null;
};

// ===== POLLING =====
let pollingOffset = 0;
let pollingStarted = false;

const handleUpdate = async (update) => {
  const msg = update.message;
  if (!msg || !msg.text) return;
  const chatId = String(msg.chat.id);

  const match = msg.text.match(/^\/start\s+(.+)$/);
  if (match) {
    const token = match[1].trim();
    const link = await TelegramLink.findOneAndUpdate(
      { token },
      { telegramId: chatId },
      { new: true }
    );
    if (link) {
      await sendMessage(
        "✅ <b>Hisobingiz saytga muvaffaqiyatli ulandi!</b>\nEndi zakaz holati o'zgarganda shu yerga avtomatik xabar olasiz.",
        { chatId }
      );
    } else {
      await sendMessage(
        "⚠️ Havola muddati tugagan yoki noto'g'ri. Iltimos, saytdan qaytadan urinib ko'ring.",
        { chatId }
      );
    }
    return;
  }

  if (msg.text === "/start") {
    await sendMessage(
      "👋 Salom! Zakaz holatlari haqida shu yerga xabar olish uchun saytdagi \"📲 Telegram orqali ulanish\" tugmasini bosing.",
      { chatId }
    );
  }
};

const pollUpdates = async () => {
  if (!pollingStarted || !BOT_TOKEN) return;
  
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${pollingOffset}&timeout=25`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) return;

    for (const update of data.result) {
      pollingOffset = update.update_id + 1;
      await handleUpdate(update);
    }
  } catch (err) {
    console.error("❌ Telegram polling xatosi:", err.message);
  } finally {
    if (pollingStarted) {
      setTimeout(pollUpdates, 1000);
    }
  }
};

export const startTelegramPolling = () => {
  if (pollingStarted || !BOT_TOKEN) {
    if (!BOT_TOKEN) console.log("⚠️ TELEGRAM_BOT_TOKEN yo'q — bot tinglanmaydi");
    return;
  }
  pollingStarted = true;
  console.log("🤖 Telegram bot tinglanmoqda (mijozlarni ulash uchun)...");
  pollUpdates();
};

export const stopTelegramPolling = () => {
  pollingStarted = false;
  console.log("🛑 Telegram polling to'xtatildi");
};