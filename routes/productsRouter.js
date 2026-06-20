import express from "express";
import upload from "../middleware/upload.js";

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

router.post(
  "/menus",
  upload.single("image"),
  createMenu
);

router.put(
  "/menus/:id",
  upload.single("image"),
  updateMenu
);

router.delete("/menus/:id", deleteMenu);

export default router;