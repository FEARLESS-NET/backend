import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Faqat rasm yuklash mumkin (jpeg, png, webp)"));
  }
};

export const uploadFromUrl = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const filename = Date.now() + path.extname(imageUrl.split('?')[0]);
    const filepath = path.join('uploads', filename);
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/uploads/${filename}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('URL dan rasm yuklash xatosi:', error.message);
    return null;
  }
};

export default multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});