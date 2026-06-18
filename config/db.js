import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/restaurant_db", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB ulandi: ${conn.connection.host}`);
    console.log(`📀 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB ulanish xatosi:", error.message);
    console.log("⚠️ Ma'lumotlar bazasiga ulanmadi, lekin server ishlashda davom etadi...");
    // process.exit(1); // Ishlab chiqishda comentga oling
  }
};

export default connectDB;