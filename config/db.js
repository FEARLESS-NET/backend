import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("⏳ MongoDB ga ulanish...");
    
    // ✅ useNewUrlParser va useUnifiedTopology O'CHIRILDI (4.0.0 dan keyin kerak emas)
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb+srv://LeoricTeam:leoricteam@cluster0.nj2njus.mongodb.net/restaurnat_db?appName=Cluster",
      {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        family: 4,
        retryWrites: true,
        w: "majority",
        tls: true,
        tlsAllowInvalidCertificates: true,
      }
    );
    
    console.log(`✅ MongoDB ulandi: ${conn.connection.host}`);
    console.log(`📀 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB ulanish xatosi:", error.message);
    console.log("⏳ 5 soniyadan keyin qayta urinish...");
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;