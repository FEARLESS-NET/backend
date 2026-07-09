import express from "express";
import {
  getMenu,
  getOne,
  createMenu,
  updateMenu,
  deleteMenu,
} from "../controllers/productsController.js";

const router = express.Router();

// ✅ MULTER O'CHIRILDI! Endi multer kerak emas
router.get("/menus", getMenu);
router.get("/menus/:id", getOne);

// ✅ express-fileupload avtomatik ishlaydi
router.post("/menus", createMenu);
router.put("/menus/:id", updateMenu);
router.delete("/menus/:id", deleteMenu);

// URL dan rasm yuklash (agar kerak bo'lsa)
router.post("/upload/url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL kiritilishi shart" });
    }
    
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const filename = Date.now() + '.jpg';
    const uploadPath = path.join(process.cwd(), 'uploads', filename);
    
    fs.writeFileSync(uploadPath, response.data);
    
    res.json({ 
      success: true, 
      filename: `/uploads/${filename}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;