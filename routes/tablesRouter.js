import express from "express";
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
} from "../controllers/tablesControllers.js";

const router = express.Router();

router.get("/tables", getTables);          // GET    /api/v1/tables
router.post("/tables", createTable);       // POST   /api/v1/tables
router.put("/tables/:id", updateTable);    // PUT    /api/v1/tables/:id
router.delete("/tables/:id", deleteTable); // DELETE /api/v1/tables/:id

export default router;
