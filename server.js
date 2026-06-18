import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import productRouter from "./routes/productsRouter.js";
import tableRouter from "./routes/tableRouter.js";
import reservationRouter from "./routes/reservationRouter.js";
import orderRouter from "./routes/orderRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads papkasini yaratish
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const app = express();
const PORT = process.env.PORT || 3005;

// MongoDB ga ulanish
connectDB();

// CORS - FRONTEND uchun to'g'ri sozlash
// backend/server.js
app.use(cors({
  origin: [
    "https://restaurant-frontend.onrender.com",  // Frontend URL
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik fayllar
app.use("/uploads", express.static("uploads"));

// API routerlar
app.use("/api/v1", productRouter);
app.use("/api/v1", tableRouter);
app.use("/api/v1", reservationRouter);
app.use("/api/v1", orderRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Restaurant API is running", 
    version: "1.0.0",
    endpoints: {
      menus: "/api/v1/menus",
      tables: "/api/v1/tables",
      reservations: "/api/v1/reservations",
      orders: "/api/v1/orders"
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/v1`);
});
