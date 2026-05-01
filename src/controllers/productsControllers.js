const menus = [
  { id: 1, name: 'Mirzohid', price: 17, retsept: 'chocolate', image: 'https://www.gazeta.uz/media/img/2025/08/SXMbbq17546539828389_l.webp',category: 'coffe' },
  { id: 2, name: 'Abdulaziz', price: 15, retsept: 'football',  image: 'https://www.gazeta.uz/media/img/2025/08/SXMbbq17546539828389_l.webp',category: 'coffe'},
  { id: 3, name: 'Ibrohim', price: 15, retsept: 'gaming',  image: 'https://www.gazeta.uz/media/img/2025/08/SXMbbq17546539828389_l.webp' ,  category: 'coffe'},
  { id: 4, name: 'Musallam', price: 14, retsept: 'drawing',  image: 'https://www.gazeta.uz/media/img/2025/08/SXMbbq17546539828389_l.webp',category: 'coffe'}
];

// GET ALL
export const getMenu = (req, res) => {
  try {
    res.json({ menus });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// id
// products topamiz id orqali
// agar product yoq bolsa, error jonatamiz
// yoqsa productni
export const getOne = (req, res) => {
  try {
    const {id} = req.params
    const product = menus.find(i => i.id === Number(id))
    if (!product) {
      res.json({message: "product topilmadi"})
    }
    res.json({data: product})
  } catch (error) {
    res.json({message: error.message})
  }
}

// CREATE
export const createMenu = async (req, res) => {
  try {
    const { name, price, retsept, image, category } = req.body;

    const newMenu = {
      id: menus.length + 1,
      name,
      price,
      retsept,
      image,
      category
    };

    menus.push(newMenu); // ✅ to‘g‘ri

    res.status(201).json({
      message: 'New menu is created',
      newMenu
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE
export const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, retsept, image, category } = req.body;

    const menu = menus.find((u) => u.id === Number(id));

    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    if (name) menu.name = name;
    if (price) menu.price = price;
    if (retsept) menu.retsept = retsept;
    if (image) menu.image = image;
    if (category) menu.category = category;

    res.status(200).json({
      message: 'Menu is updated',
      updatedMenu: menu
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};  

// DELETE
export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const index = menus.findIndex(u => u.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    menus.splice(index, 1);

    res.status(200).json({ message: 'Menu is deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

