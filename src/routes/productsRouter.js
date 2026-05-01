import express from 'express';
import * as productsControllers from '../controllers/productsControllers.js';

const router = express.Router();

router.get('/menus', productsControllers.getMenu);
router.get('/menus/:id', productsControllers.getOne)
router.post('/menus', productsControllers.createMenu);
router.put('/menus/:id', productsControllers.updateMenu);
router.delete('/menus/:id', productsControllers.deleteMenu);

export default router;