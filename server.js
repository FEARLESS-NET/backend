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
import fs from "fs";
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

// ============ UPLOADS PAPKASI ============
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("📁 Uploads papkasi yaratildi:", uploadsPath);
}

const app = express();
const PORT = process.env.PORT || 3005;

// ✅ TUZATILDI: Helmet standart holatda "Cross-Origin-Resource-Policy: same-origin"
// headerini qo'shadi — bu CORS "Access-Control-Allow-Origin: *" bo'lsa ham,
// brauzerni rasmlarni boshqa domendan (frontend) yuklashdan bloklaydi.
// Shuning uchun rasmlar hech qachon ko'rinmagan edi.
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ============ FILE UPLOAD ============
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: false,
  safeFileNames: true,
  preserveExtension: true,
}));

// ============ CORS - TO'LIQ SOZLAMALAR ============
const allowedOrigins = [
  "https://qrcode-4-hqdm.onrender.com",
  "https://backend-4-9otm.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3005",
  process.env.FRONTEND_URL
].filter(Boolean);

// ✅ TO'LIQ CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // ✅ Barcha localhost portlariga ruxsat
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

// ✅ QO'SHIMCHA CORS - BARCHA SO'ROVLAR UCHUN
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ============ RATE LIMIT ============
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

// ============ MIDDLEWARES ============
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression({ level: 6, threshold: 1024 }));

// ============ STATIK FAYLLAR ============
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // ✅ CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    // ✅ TUZATILDI: 'no-cache' -> uzoq muddatli kesh (fayl nomlari noyob/o'zgarmas
    // bo'lgani uchun xavfsiz). Brauzer rasmni qayta-qayta yuklamaydi, sayt tezroq ochiladi.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    // ✅ YANGI: Helmet blokini rasm darajasida ham bekor qilamiz
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // ✅ Content-Type
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.webp') {
      res.setHeader('Content-Type', 'image/webp');
    } else if (ext === '.jfif' || ext === '.fif') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.gif') {
      res.setHeader('Content-Type', 'image/gif');
    } else if (ext === '.svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

console.log("📁 Uploads papkasi statik qilindi:", uploadsPath);

// ============ DEBUG ============
app.get('/test-uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsPath);
    res.json({
      success: true,
      path: uploadsPath,
      exists: fs.existsSync(uploadsPath),
      files: files,
      fileUrls: files.map(f => `/uploads/${f}`)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ LOGGING ============
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'unknown'}`);
  next();
});

app.use((req, res, next) => {
  req.setTimeout(60000);
  res.setTimeout(60000);
  next();
});

// ============ HEALTH ============
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

// ============ ROUTES ============
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

// ============ ERROR HANDLING ============
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

// ============ START ============
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