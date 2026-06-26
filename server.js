import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ .env faylni yuklash
dotenv.config({ path: path.join(__dirname, ".env") });

// ✅ DNS sozlamalari
import dns from 'dns';
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

// ─── ✅ ROOT ROUTE ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ 
    message: "Restaurant API is running ✅", 
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// ─── ✅ HEALTH CHECK ENDPOINT (UptimeRobot uchun) ──────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    database: 'MongoDB connected ✅',
    service: 'Restaurant API'
  });
});

// ─── ✅ CORS SOZLAMALARI ────────────────────────────────────────────
const allowedOrigins = [
  "https://qrcode-1-qo6i.onrender.com",  // Frontend
  "https://backend-2-qyr4.onrender.com", // Backend
  "http://localhost:5173",                // Local Vite
  "http://localhost:3000",                // Local React
  "http://localhost:3005"                 // Local backend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`❌ Blocked origin: ${origin}`);
      callback(new Error(`CORS ruxsat berilmadi: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
}));

// ✅ Preflight so'rovlari
app.options('*', cors());

// ─── ✅ MIDDLEWARE ──────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use("/uploads", express.static("uploads"));

// ✅ Request logger
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// ─── ✅ ROUTES ──────────────────────────────────────────────────────
app.use("/api/v1", productRouter);
app.use("/api/v1", tableRouter);
app.use("/api/v1", reservationRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", paymentRouter);
app.use("/api/v1", reportRouter);
app.use("/api/v1", telegramRoutes);

// ─── ✅ 404 HANDLER ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route topilmadi: ${req.originalUrl}`
  });
});

// ─── ✅ GLOBAL ERROR HANDLER ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Server xatosi:", err.message);
  console.error("❌ Stack:", err.stack);
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      success: false, 
      message: err.message,
      details: "CORS ruxsat berilmadi. Frontend URL'ni tekshiring."
    });
  }
  
  res.status(500).json({ 
    success: false, 
    message: err.message || "Server xatosi yuz berdi" 
  });
});

// ─── ✅ SERVER START ────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB ulandi");
    
    startTelegramPolling();
    console.log("✅ Telegram bot ishga tushdi");

    app.listen(PORT, () => {
      console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
      console.log(`✅ Production URL: https://backend-4-9otm.onrender.com`);
      console.log(`✅ Health Check: https://backend-4-9otm.onrender.com/health`);
      console.log(`📊 Hisobotlar zakaz yaratilganda avtomatik yangilanadi`);
      console.log(`🔄 Reset faqat qo'lda, admin paneldagi tugmalar orqali`);
    });

  } catch (error) {
    console.error("❌ Serverni ishga tushirishda xatolik:", error.message);
    console.log("⏳ 10 soniyadan keyin qayta urinish...");
    setTimeout(startServer, 10000);
  }
};

startServer();