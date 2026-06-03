import express from "express";
import {
  getMenu,
  getOne,
  createMenu,
  updateMenu,
  deleteMenu,
} from "../controllers/productsControllers.js";

const router = express.Router();

router.get("/menus", getMenu);           // GET    /api/v1/menus
router.get("/menus/:id", getOne);        // GET    /api/v1/menus/:id
router.post("/menus", createMenu);       // POST   /api/v1/menus
router.put("/menus/:id", updateMenu);    // PUT    /api/v1/menus/:id
router.delete("/menus/:id", deleteMenu); // DELETE /api/v1/menus/:id

export default router;
