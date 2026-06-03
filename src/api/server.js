import dotenv from "dotenv";
dotenv.config(); // ✅ Eng birinchi bo'lishi SHART

import express from "express";
import cors from "cors";
import router from "../routes/productsRouter.js";   // ✅ src/api/server.js → src/routes/
import connectDB from "../config/db.js";             // ✅ src/api/server.js → src/config/

const app = express();
const PORT = process.env.PORT || 3005;

connectDB();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());
app.use("/api/v1", router);

app.listen(PORT, () => {
  console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
});
