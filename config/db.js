import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("⏳ MongoDB ga ulanish...");
    
    // ✅ TIMEOUT QO'SHILDI
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB ulandi: ${conn.connection.host}`);
    console.log(`📀 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB ulanish xatosi: ${error.message}`);
    console.log("⏳ 5 soniyadan keyin qayta urinish...");
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;