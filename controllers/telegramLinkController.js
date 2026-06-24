import crypto from "crypto";
import TelegramLink from "../models/TelegramLink.js";
import { getBotUsername } from "../services/telegramService.js";

// ─── Yangi ulash tokeni yaratish ───────────────────────────────────────────
export const createLinkToken = async (req, res) => {
  try {
    const token = crypto.randomBytes(16).toString("hex");
    await TelegramLink.create({ token });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Token holatini tekshirish ─────────────────────────────────────────────
export const getLinkStatus = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await TelegramLink.findOne({ token });

    if (!link) {
      return res
        .status(404)
        .json({ success: false, message: "Token topilmadi yoki muddati tugagan" });
    }

    res.json({ success: true, telegramId: link.telegramId || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Bot username'ini frontendga berish ────────────────────────────────────
export const getBotInfo = async (req, res) => {
  try {
    const username = await getBotUsername();
    if (!username) {
      return res.status(500).json({ success: false, message: "Bot username olinmadi" });
    }
    res.json({ success: true, username });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};