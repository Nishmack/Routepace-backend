const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");

dotenv.config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION!", err.name, err.message);
  process.exit(1);
});

if (process.env.NODE_ENV !== "production") {
  // Local dev: start server normally
  connectDB()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log("RoutePace API running on port", PORT);
      });
      process.on("unhandledRejection", (err) => {
        console.error("UNHANDLED REJECTION!", err.name, err.message);
        server.close(() => process.exit(1));
      });
      process.on("SIGTERM", () => {
        server.close(() => {
          mongoose.connection.close(false, () => process.exit(0));
        });
      });
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      process.exit(1);
    });
} else {
  // Vercel: connect on cold start
  connectDB().catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
}

// Required for Vercel
module.exports = app;
