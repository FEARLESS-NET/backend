import express from "express";
import {
  getTables,
  getOneTable,
  createTable,
  updateTable,
  deleteTable,
  getAvailableTables,
} from "../controllers/tableController.js";

const router = express.Router();

router.get("/tables", getTables);
router.get("/tables/available", getAvailableTables); // ?date=2024-12-01&time=19:00
router.get("/tables/:id", getOneTable);
router.post("/tables", createTable);
router.put("/tables/:id", updateTable);
router.delete("/tables/:id", deleteTable);

export default router;
