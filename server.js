import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import cors from "cors";
import fs from "fs";

import connectDB from "./config/db.js";
import productRouter from "./routes/productsRouter.js";
import tableRouter from "./routes/tableRouter.js";
import reservationRouter from "./routes/reservationRouter.js";
import orderRouter from "./routes/orderRouter.js";
import paymentRouter from "./routes/paymentRouter.js";
import reportRouter from "./routes/reportRouter.js";
import { autoGenerateReports } from "./controllers/reportController.js";

// Uploads papkasini yaratish
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const app = express();
const PORT = process.env.PORT || 3005;

// MongoDB
connectDB();

// CORS
app.use(
  cors({
    origin: [
      "https://restaurant-frontend.onrender.com",
      "http://localhost:5173",
      "http://localhost:3000",
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
app.use("/api/v1", reportRouter); // ✅ YANGI

app.get("/", (req, res) => {
  res.json({ message: "Restaurant API is running ✅", version: "1.0.0" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server xatosi:", err.message);
  res.status(500).json({ success: false, message: err.message });
});

// 🕐 Har kuni soat 23:59 da avtomatik hisobot yaratish
const scheduleDailyReport = () => {
  const now = new Date();
  const night = new Date(now);
  night.setHours(23, 59, 0, 0);

  const msUntilNight = night.getTime() - now.getTime();
  const msInDay = 24 * 60 * 60 * 1000;

  setTimeout(() => {
    autoGenerateReports();
    setInterval(autoGenerateReports, msInDay);
  }, msUntilNight);
};

scheduleDailyReport();

app.listen(PORT, () => {
  console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
});