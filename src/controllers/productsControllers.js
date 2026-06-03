import Menu from "../models/Menu.js"; 

// GET ALL — barcha menularni olish
export const getMenu = async (req, res) => {
  try {
    const menus = await Menu.find();
    res.json({ menus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ONE — bitta menuni id bo'yicha olish
export const getOne = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
      return res.status(404).json({ message: "Menu topilmadi" });
    }

    res.json({ data: menu });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE — yangi menu yaratish
export const createMenu = async (req, res) => {
  try {
    const menu = await Menu.create(req.body);
    res.status(201).json({
      message: "Yangi menu yaratildi ✅",
      menu,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE — menuni yangilash
export const updateMenu = async (req, res) => {
  try {
    const updatedMenu = await Menu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // ✅ runValidators: validatsiyani yangilashda ham ishlatish
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: "Menu topilmadi" });
    }

    res.json({
      message: "Menu yangilandi ✅",
      updatedMenu,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE — menuni o'chirish
export const deleteMenu = async (req, res) => {
  try {
    const deletedMenu = await Menu.findByIdAndDelete(req.params.id);

    if (!deletedMenu) {
      return res.status(404).json({ message: "Menu topilmadi" });
    }

    res.json({
      message: "Menu o'chirildi ✅",
      id: req.params.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
