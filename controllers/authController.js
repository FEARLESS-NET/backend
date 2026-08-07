/**
 * AUTH CONTROLLER – Login va token generatsiyasi
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// 1. Login - token beradi
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email va parol kiritilishi shart.'
      });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Email yoki parol noto‘g‘ri.'
      });
    }

    const token = jwt.sign(
      { 
        email: ADMIN_EMAIL, 
        role: 'admin',
        id: 'admin-001'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login muvaffaqiyatli!',
      token,
      user: {
        email: ADMIN_EMAIL,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('❌ Login xatosi:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi.'
    });
  }
};

// 2. Verify - token validligini tekshiradi
export const verify = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};