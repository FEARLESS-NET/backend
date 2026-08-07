/**
 * AUTH MIDDLEWARE – JWT token tekshiruvi
 */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token topilmadi. Iltimos, tizimga kiring.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET topilmadi!');
      return res.status(500).json({
        success: false,
        message: 'Serverda xatolik yuz berdi.'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    console.error('❌ Token xatosi:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Sessiya muddati tugagan. Qaytadan kiring.' 
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Noto‘g‘ri token. Qaytadan kiring.' 
      });
    }

    res.status(401).json({ 
      success: false, 
      message: 'Autentifikatsiya xatosi' 
    });
  }
};