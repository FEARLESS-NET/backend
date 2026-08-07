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

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import fileUpload from 'express-fileupload';

import { verifyToken } from './middleware/authMiddleware.js';
import telegramRoutes from "./routes/telegramRoutes.js";
import { startTelegramPolling } from "./services/telegramService.js";

import authRouter from './routes/authRouter.js';
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

// ============================================
// 1. XAVFSIZLIK MIDDLEWARE
// ============================================

// Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// File upload
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: false,
  safeFileNames: true,
  preserveExtension: true,
}));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://qrcode-4-hqdm.onrender.com",
  "https://backend-4-9otm.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3005"
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost')) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS bloklandi: ${origin}`);
      callback(new Error('CORS ruxsat berilmadi'));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400
}));

app.options('*', cors());

// JSON va URL encoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression({ level: 6, threshold: 1024 }));


// Timeout
app.use((req, res, next) => {
  req.setTimeout(60000);
  res.setTimeout(60000);
  next();
});

// ============================================
// 2. RATE LIMITING
// ============================================

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2000,
  message: { success: false, message: "Juda ko'p so'rov, birozdan keyin qayta urining." },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000,
  message: { success: false, message: "Admin: Juda ko'p so'rov." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin endpointlarga maxsus limiter
app.use('/api/v1/tables', adminLimiter);
app.use('/api/v1/menus', adminLimiter);
app.use('/api/v1/reservations', adminLimiter);
app.use('/api/v1/orders', adminLimiter);
app.use('/api/v1/reports', adminLimiter);
app.use('/api/v1/payments', adminLimiter);

app.use(generalLimiter);

// ============================================
// 3. ROUTERLAR (TO'G'RI TARTIBDA)
// ============================================

// 3.1. AUTH ROUTER (login va verify - HIMOYASIZ) - BIRINCHI!
app.use('/api/v1', authRouter);

// 3.2. 🔒 ADMIN ENDPOINTLARNI HIMOYALASH (verifyToken)
app.use('/api/v1/menus', verifyToken);
app.use('/api/v1/tables', verifyToken);
app.use('/api/v1/reservations', verifyToken);
app.use('/api/v1/orders', verifyToken);
app.use('/api/v1/reports', verifyToken);
app.use('/api/v1/payments', verifyToken);

// 3.3. QOLGAN ROUTERLAR
app.use("/api/v1", productRouter);
app.use("/api/v1", tableRouter);
app.use("/api/v1", reservationRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", paymentRouter);
app.use("/api/v1", reportRouter);
app.use("/api/v1", telegramRoutes);
app.use("/api/v1", receiptRoutes);

// ============================================
// 4. HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Restaurant API',
    frontend: process.env.FRONTEND_URL || 'https://qrcode-4-hqdm.onrender.com'
  });
});

// ============================================
// 5. 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route topilmadi: ${req.originalUrl}` 
  });
});

// ============================================
// 6. XATOLIKLARNI BOSHQARISH
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Server xatosi:', err.message);
  console.error(err.stack);

  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      success: false, 
      message: 'CORS ruxsat berilmadi' 
    });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Serverda ichki xatolik yuz berdi' : err.message;
  res.status(status).json({ 
    success: false, 
    message 
  });
});

// ============================================
// 7. SERVERNI ISHGA TUSHIRISH
// ============================================

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB ulandi");
    
    startTelegramPolling();
    console.log("✅ Telegram bot ishga tushdi");

    const server = app.listen(PORT, () => {
      console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
      console.log(`✅ Ruxsat etilgan originlar:`, allowedOrigins);
    });

    server.timeout = 60000;
    server.keepAliveTimeout = 60000;
  } catch (error) {
    console.error("❌ Serverni ishga tushirishda xatolik:", error.message);
    setTimeout(startServer, 10000);
  }
};

startServer();