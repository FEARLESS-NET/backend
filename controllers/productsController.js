import Menu from "../models/menu.js";
import path from "path";
import fs from "fs";

// ✅ YANGI: Silka (URL) orqali berilgan rasmni serverga o'zi yuklab, /uploads
// papkasiga saqlaydi. Shunda rasm hotlink-himoyalangan tashqi saytlarga
// (masalan dostavka-eda.com) bog'liq bo'lmay qoladi — o'z domenimizdan xizmat qiladi.
const downloadImageFromUrl = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // ✅ 15s timeout — server osilib qolmasin

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // ✅ Ba'zi saytlar User-Agent yo'qligi uchun ham bloklaydi
        "User-Agent": "Mozilla/5.0 (compatible; QozondaBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Rasm yuklab bo'lmadi (status: ${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new Error("Silka rasm emas");
    }

    // ✅ Kengaytmani content-type'dan aniqlash
    const extMap = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    const ext = extMap[contentType.split(";")[0].trim()] || ".jpg";

    const buffer = Buffer.from(await response.arrayBuffer());

    // ✅ Hajm cheklovi — 10MB dan katta rasm qabul qilinmaydi
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error("Rasm hajmi juda katta (10MB dan oshmasligi kerak)");
    }

    const filename = Date.now() + ext;
    const uploadPath = path.join(process.cwd(), "uploads", filename);
    fs.writeFileSync(uploadPath, buffer);

    return `/uploads/${filename}`;
  } finally {
    clearTimeout(timeout);
  }
};

// ✅ EXPRESS-FILEUPLOAD BILAN
export const getMenu = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const category = req.query.category;

    let query = {};
    if (category) query.category = category;

    const [menus, total] = await Promise.all([
      Menu.find(query)
        .select('name price image retsept category')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
        .maxTimeMS(60000),
      Menu.countDocuments(query)
    ]);

    res.json({
      success: true,
      menus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Menu xatosi:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getOne = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu topilmadi" });
    }
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CREATE MENU - EXPRESS-FILEUPLOAD
export const createMenu = async (req, res) => {
  try {
    let imagePath = "";
    
    if (req.files && req.files.image) {
      const file = req.files.image;
      
      // ✅ .fif, .jfif ni .jpg ga o'zgartirish
      let ext = path.extname(file.name).toLowerCase();
      const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
      
      if (!allowedExt.includes(ext)) {
        ext = '.jpg'; // Default .jpg
      }
      
      const filename = Date.now() + ext;
      const uploadPath = path.join(process.cwd(), 'uploads', filename);
      
      await file.mv(uploadPath);
      imagePath = `/uploads/${filename}`;
      
      console.log("📸 Yuklangan fayl nomi:", file.name);
      console.log("📸 Saqlanayotgan manzil:", imagePath);
      console.log("📸 Fayl saqlandi:", uploadPath);
    } else if (req.body.image && req.body.image.trim()) {
      const rawUrl = req.body.image.trim();
      // ✅ YANGI: silka bo'lsa — serverga yuklab olamiz (hotlink himoyasidan qochish uchun)
      if (rawUrl.startsWith("http")) {
        try {
          imagePath = await downloadImageFromUrl(rawUrl);
          console.log("📸 Silkadan yuklab olindi:", rawUrl, "->", imagePath);
        } catch (downloadErr) {
          console.error("❌ Silkadan rasm yuklab bo'lmadi:", downloadErr.message);
          return res.status(400).json({
            success: false,
            message: `Rasm silkasidan yuklab bo'lmadi: ${downloadErr.message}. Iltimos, rasmni fayl sifatida yuklang.`,
          });
        }
      } else {
        imagePath = rawUrl;
      }
    }

    const menuData = {
      name: req.body.name,
      price: Number(req.body.price),
      retsept: req.body.retsept || "",
      category: req.body.category || "Boshqa",
      image: imagePath,
    };

    console.log("📸 Saqlanayotgan ma'lumot:", menuData);

    const menu = await Menu.create(menuData);

    res.status(201).json({
      success: true,
      message: "Menu yaratildi ✅",
      menu,
    });
  } catch (error) {
    console.error("❌ Create menu error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE MENU - EXPRESS-FILEUPLOAD
export const updateMenu = async (req, res) => {
  try {
    let imagePath = "";
    
    // ✅ express-fileupload bilan rasm yangilash
    if (req.files && req.files.image) {
      const file = req.files.image;
      const filename = Date.now() + path.extname(file.name);
      const uploadPath = path.join(process.cwd(), 'uploads', filename);
      
      await file.mv(uploadPath);
      imagePath = `/uploads/${filename}`;
      
      console.log("📸 Yangi yuklangan fayl:", file.name);
      console.log("📸 Saqlanayotgan manzil:", imagePath);
    } else if (req.body.image && req.body.image.trim()) {
      imagePath = req.body.image.trim();
      console.log("📸 Body dan kelgan manzil:", imagePath);
    }

    const data = {
      name: req.body.name,
      price: Number(req.body.price),
      retsept: req.body.retsept || "",
      category: req.body.category || "Boshqa",
    };

    if (imagePath) {
      data.image = imagePath;
    }

    console.log("📸 Yangilanayotgan ma'lumot:", data);

    const updatedMenu = await Menu.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu topilmadi",
      });
    }

    res.json({
      success: true,
      message: "Menu yangilandi ✅",
      menu: updatedMenu,
    });

  } catch (error) {
    console.error("❌ Update menu error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    const deletedMenu = await Menu.findByIdAndDelete(req.params.id);

    if (!deletedMenu) {
      return res.status(404).json({ success: false, message: "Menu topilmadi" });
    }

    res.json({
      success: true,
      message: "Menu o'chirildi ✅",
      id: req.params.id,
    });
  } catch (error) {
    console.error("❌ Delete menu error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};