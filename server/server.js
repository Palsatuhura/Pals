const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const setupSocket = require("./socket");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
  "https://pals-chat.vercel.app",
  "http://localhost:5173",
];

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Express CORS setup
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Make io accessible to routes
app.set("io", io);

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// Setup socket handlers
setupSocket(io);

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: "majority",
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
};

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    console.log("Connected to MongoDB");
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", {
      name: err.name,
      message: err.message,
      code: err.code,
      reason: err.reason,
    });
    process.exit(1);
  });
