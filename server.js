/**
 * ASOSIY SERVER
 * Express, CORS, Helmet, compression, fileUpload, rate limit.
 * Rasmlar endi ImgBB'da saqlanadi (server diskida emas).
 * Barcha routerlarni ulash.
 * MongoDB ulanish va Telegram pollingni ishga tushirish.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import fileUpload from 'express-fileupload';

import telegramRoutes from "./routes/telegramRoutes.js";
import { startTelegramPolling } from "./services/telegramService.js";
import connectDB from "./config/db.js";
import productRouter from "./routes/productsRouter.js";
import tableRouter from "./routes/tableRouter.js";
import reservationRouter from "./routes/reservationRouter.js";
import orderRouter from "./routes/orderRouter.js";
import paymentRouter from "./routes/paymentRouter.js";
import reportRouter from "./routes/reportRouter.js";
import receiptRoutes from "./routes/receiptRouter.js";

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: false,
  safeFileNames: true,
  preserveExtension: true,
}));

const allowedOrigins = [
  "https://qrcode-4-hqdm.onrender.com",
  "https://backend-4-9otm.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3005",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost')) {
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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
}));

app.options('*', cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2000,
  message: {
    status: 429,
    error: "Juda ko'p so'rov yubordingiz! Iltimos, birozdan keyin qayta urining."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000,
  message: {
    status: 429,
    error: "Admin: Juda ko'p so'rov. Iltimos, birozdan keyin qayta urining."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression({ level: 6, threshold: 1024 }));

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'unknown'}`);
  next();
});

app.use((req, res, next) => {
  req.setTimeout(60000);
  res.setTimeout(60000);
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    message: "Restaurant API is running ✅", 
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

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
    service: 'Restaurant API',
    frontend: process.env.FRONTEND_URL || 'https://qrcode-4-hqdm.onrender.com'
  });
});

app.use('/api/v1/tables', adminLimiter);
app.use('/api/v1/menus', adminLimiter);
app.use('/api/v1/reservations', adminLimiter);
app.use('/api/v1/orders', adminLimiter);
app.use('/api/v1/reports', adminLimiter);
app.use('/api/v1/payments', adminLimiter);

app.use(generalLimiter);

app.use("/api/v1", productRouter);
app.use("/api/v1", tableRouter);
app.use("/api/v1", reservationRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", paymentRouter);
app.use("/api/v1", reportRouter);
app.use("/api/v1", telegramRoutes);
app.use("/api/v1", receiptRoutes);

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route topilmadi: ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Server xatosi:", err.message);
  console.error(err.stack);
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      success: false, 
      message: err.message,
      details: "CORS ruxsat berilmadi."
    });
  }
  
  res.status(500).json({ 
    success: false, 
    message: err.message || "Server xatosi yuz berdi" 
  });
});

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB ulandi");
    
    startTelegramPolling();
    console.log("✅ Telegram bot ishga tushdi");

    const server = app.listen(PORT, () => {
      console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
      console.log(`✅ Allowed origins:`, allowedOrigins);
    });

    server.timeout = 60000;
    server.keepAliveTimeout = 60000;
  } catch (error) {
    console.error("❌ Serverni ishga tushirishda xatolik:", error.message);
    setTimeout(startServer, 10000);
  }
};

startServer();