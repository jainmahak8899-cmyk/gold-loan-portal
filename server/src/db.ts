import mongoose from "mongoose";
import { CONFIG } from "./config";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(CONFIG.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${CONFIG.MONGODB_URI}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}
