import Menu from "../models/menu.js";

// GET ALL — barcha menularni olish
export const getMenu = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // ✅ Faqat 20 ta
    const skip = (page - 1) * limit;
    const category = req.query.category;

    let query = {};
    if (category) query.category = category;

    // ✅ Parallel so'rovlar (tezroq)
    const [menus, total] = await Promise.all([
      Menu.find(query)
        .select('name price image retsept category')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
        .maxTimeMS(15000),
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

// GET ONE — bitta menuni id bo'yicha olish
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

// CREATE — yangi menu yaratish
export const createMenu = async (req, res) => {
  try {
    const menuData = {
      name: req.body.name,
      price: Number(req.body.price),
      retsept: req.body.retsept || "",
      category: req.body.category || "Boshqa",
      // ✅ Fayl yuklangan bo'lsa — local fayl yo'li; aks holda req.body.image
      // (masalan, admin panelda to'g'ridan-to'g'ri kiritilgan URL) ishlatiladi.
      // Avval bu yerda faqat req.file tekshirilardi, shu sabab URL orqali
      // qo'shilgan rasm hech qachon saqlanmas edi.
      image: req.file ? `/uploads/${req.file.filename}` : (req.body.image || ""),
    };

    const menu = await Menu.create(menuData);

    res.status(201).json({
      success: true,
      message: "Menu yaratildi ✅",
      menu,
    });
  } catch (error) {
    console.error("Create menu error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE — menuni yangilash
export const updateMenu = async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      price: Number(req.body.price),
      retsept: req.body.retsept || "",
      category: req.body.category || "Boshqa",
    };

    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      // ✅ Yangi fayl yuklanmagan, lekin URL kiritilgan bo'lsa — shuni saqlaymiz
      data.image = req.body.image;
    }

    const updatedMenu = await Menu.findByIdAndUpdate(
      req.params.id,
      data,
      {
        new: true,
        runValidators: true,
      }
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE — menuni o'chirish
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
    res.status(500).json({ success: false, message: error.message });
  }
};