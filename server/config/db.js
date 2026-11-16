const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Atlas connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    if (error.reason?.servers) {
      for (const [address, server] of error.reason.servers) {
        console.log("Server:", address);
        console.log("Server error:", server.error?.message);
      }
    }

    process.exit(1);
  }
};

module.exports = connectDB;
