import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ .env faylni yuklash
dotenv.config({ path: path.join(__dirname, ".env") });

// ✅ DNS sozlamalari - muammoni hal qilish uchun
import dns from 'dns';

// DNS serverlarni o'rnatish (Cloudflare va Google)
dns.setServers(['1.1.1.1', '8.8.8.8', '9.9.9.9']);
console.log("🌐 DNS serverlar:", dns.getServers());

import express from "express";
import cors from "cors";
import fs from "fs";

import telegramRoutes from "./routes/telegramRoutes.js";
import { startTelegramPolling } from "./services/telegramService.js";
import connectDB from "./config/db.js";
import productRouter from "./routes/productsRouter.js";
import tableRouter from "./routes/tableRouter.js";
import reservationRouter from "./routes/reservationRouter.js";
import orderRouter from "./routes/orderRouter.js";
import paymentRouter from "./routes/paymentRouter.js";
import reportRouter from "./routes/reportRouter.js";

// Uploads papkasini yaratish
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
  console.log("📁 uploads/ papkasi yaratildi");
}

const app = express();
const PORT = process.env.PORT || 3005;

// ✅ Root route - serverni ishlayotganligini tekshirish uchun
app.get('/', (req, res) => {
  res.json({ 
    message: "Restaurant API is running ✅", 
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// ─── ✅ SERVERNI ISHGA TUSHIRISH ──────────────────────────────────────────
const startServer = async () => {
  try {
    // MongoDB ga ulanish
    await connectDB();
    
    // Telegram pollingni ishga tushirish (DB ulangandan keyin)
    startTelegramPolling();

    // CORS
    app.use(
      cors({
        origin: [
          "https://restaurant-frontend.onrender.com",
          "http://localhost:5173",
          "http://localhost:3005",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:3005",
        ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
      })
    );

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/uploads", express.static("uploads"));

    // ROUTES
    app.use("/api/v1", productRouter);
    app.use("/api/v1", tableRouter);
    app.use("/api/v1", reservationRouter);
    app.use("/api/v1", orderRouter);
    app.use("/api/v1", paymentRouter);
    app.use("/api/v1", reportRouter);
    app.use("/api/v1", telegramRoutes);

    

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ 
        success: false, 
        message: "Route topilmadi" 
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error("❌ Server xatosi:", err.message);
      res.status(500).json({ 
        success: false, 
        message: err.message || "Server xatosi yuz berdi" 
      });
    });

    app.listen(PORT, () => {
      console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
      console.log(`📊 Hisobotlar zakaz yaratilganda avtomatik yangilanadi`);
      console.log(`🔄 Reset faqat qo'lda, admin paneldagi tugmalar orqali amalga oshiriladi`);
      console.log(`✅ Reset hisobotni 0 ga tushiradi (Order/Reservation o'zgarmaydi)`);
    });

  } catch (error) {
    console.error("❌ Serverni ishga tushirishda xatolik:", error.message);
    console.log("⏳ 10 soniyadan keyin qayta urinish...");
    setTimeout(startServer, 10000);
  }
};

// ✅ Serverni ishga tushirish
startServer();