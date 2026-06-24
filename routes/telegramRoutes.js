import express from "express";
import { createLinkToken, getLinkStatus, getBotInfo } from "../controllers/telegramLinkController.js";

const router = express.Router();

router.post("/telegram/link", createLinkToken);
router.get("/telegram/link/:token", getLinkStatus);
router.get("/telegram/bot-info", getBotInfo);

export default router; 