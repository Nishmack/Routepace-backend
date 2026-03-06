const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/routepace";

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;
  connectionPromise = mongoose.connect(MONGODB_URI);
  await connectionPromise;
  isConnected = true;
  connectionPromise = null;
  console.log("MongoDB connected:", mongoose.connection.host);
};

const ensureDbConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    res.status(503).json({
      success: false,
      status: "error",
      message: "Database temporarily unavailable. Please try again.",
    });
  }
};

module.exports = { connectDB, ensureDbConnection };
