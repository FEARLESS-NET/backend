/**
 * MENYU CRUD
 * Rasmlar endi ImgBB'ga saqlanadi (doimiy, server restart bo'lsa ham yo'qolmaydi).
 */
import Menu from "../models/menu.js";

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

// Fayl buferini (express-fileupload orqali kelgan file.data) ImgBB'ga yuklaydi
const uploadBufferToImgbb = async (buffer, filename) => {
  const base64Image = buffer.toString("base64");
  const formData = new FormData();
  formData.append("image", base64Image);
  formData.append("name", filename || "menu-image");

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || "ImgBB'ga yuklashda xatolik");
  }
  return data.data.url;
};

// Tashqi URL'dan (admin panelga link kiritilganda) ImgBB'ga to'g'ridan-to'g'ri yuklaydi
const uploadUrlToImgbb = async (url) => {
  const formData = new FormData();
  formData.append("image", url);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || "ImgBB'ga yuklashda xatolik");
  }
  return data.data.url;
};

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
      message: "Ma'lumotlarni yuklashda xatolik" 
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
    console.error('❌ Get one error:', error.message);
    res.status(500).json({ success: false, message: "Ma'lumot olishda xatolik" });
  }
};

export const createMenu = async (req, res) => {
  try {
    let imagePath = "";

    if (req.files && req.files.image) {
      const file = req.files.image;
      try {
        imagePath = await uploadBufferToImgbb(file.data, file.name);
        console.log("📸 ImgBB'ga yuklandi:", imagePath);
      } catch (uploadErr) {
        console.error("❌ ImgBB'ga yuklashda xatolik:", uploadErr.message);
        return res.status(500).json({
          success: false,
          message: "Rasmni yuklashda xatolik yuz berdi",
        });
      }
    } else if (req.body.image && req.body.image.trim()) {
      const rawUrl = req.body.image.trim();
      if (rawUrl.startsWith("http")) {
        try {
          imagePath = await uploadUrlToImgbb(rawUrl);
          console.log("📸 Silkadan ImgBB'ga yuklandi:", rawUrl, "->", imagePath);
        } catch (downloadErr) {
          console.error("❌ Silkadan rasm yuklab bo'lmadi:", downloadErr.message);
          return res.status(400).json({
            success: false,
            message: "Rasm URL manzilidan yuklab bo'lmadi. Iltimos, fayl sifatida yuklang.",
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
    res.status(500).json({ success: false, message: "Menu yaratishda xatolik" });
  }
};

export const updateMenu = async (req, res) => {
  try {
    let imagePath = "";

    if (req.files && req.files.image) {
      const file = req.files.image;
      try {
        imagePath = await uploadBufferToImgbb(file.data, file.name);
        console.log("📸 Yangi rasm ImgBB'ga yuklandi:", imagePath);
      } catch (uploadErr) {
        console.error("❌ ImgBB'ga yuklashda xatolik:", uploadErr.message);
        return res.status(500).json({
          success: false,
          message: "Rasmni yuklashda xatolik yuz berdi",
        });
      }
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
      message: "Menu yangilashda xatolik",
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
    res.status(500).json({ success: false, message: "Menu o'chirishda xatolik" });
  }
};