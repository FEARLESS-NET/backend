import express from "express";
import upload, { uploadFromUrl } from "../middleware/upload.js";
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

router.post("/menus", upload.single("image"), createMenu);
router.put("/menus/:id", upload.single("image"), updateMenu);
router.delete("/menus/:id", deleteMenu);

router.post("/upload/url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL kiritilishi shart" });
    }
    const filename = await uploadFromUrl(url);
    if (filename) {
      res.json({ success: true, filename });
    } else {
      res.status(500).json({ success: false, message: "Rasm yuklanmadi" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;