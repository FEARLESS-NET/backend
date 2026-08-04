/**
 * MENYU ROUTER
 * /menus – GET, POST, PUT, DELETE.
 */
import express from "express";
import {
  getMenu,
  getOne,
  createMenu,
  updateMenu,
  deleteMenu,
} from "../controllers/productsController.js";

const router = express.Router();

router.get("/menus", getMenu);
router.get("/menus/:id", getOne);
router.post("/menus", createMenu);
router.put("/menus/:id", updateMenu);
router.delete("/menus/:id", deleteMenu);

export default router;