import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import router from "./routes/productsRouter.js";
import tablesRouter from "./routes/tablesRouter.js";
import reservationsRouter from "./routes/reservationsRouter.js";
import ordersRouter from "./routes/ordersRouter.js";
import connectDB from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 3005;

connectDB();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));

app.use(express.json());
app.use("/api/v1", router);
app.use("/api/v1", tablesRouter);
app.use("/api/v1", reservationsRouter);
app.use("/api/v1", ordersRouter);

app.listen(PORT, () => {
  console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
});