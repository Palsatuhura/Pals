const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

// Login route
router.post("/login", async (req, res) => {
  try {
    const { sessionId, username } = req.body;

    if (sessionId) {
      // Find user by sessionId
      let user = await User.findOne({ sessionId: sessionId.toUpperCase() });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Set user as online
      await user.setOnline();

      // Generate JWT token
      const token = generateToken(user);

      res.json({
        token,
        user: {
          _id: user._id,
          username: user.username,
          sessionId: user.sessionId,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          onlineStatus: user.onlineStatus,
        },
      });
    } else {
      return res.status(400).json({ message: "Session ID is required " });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Register route
router.post("/register", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "Username is required" });
    }

    // Generate a unique session ID
    const generateSessionId = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const prefix = Array(2)
        .fill()
        .map(() => chars[Math.floor(Math.random() * 26)])
        .join("");
      const middle = Array(4)
        .fill()
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");
      const year = new Date().getFullYear();
      const suffix = chars[Math.floor(Math.random() * 26)];
      return `${prefix}-${middle}-${year}${suffix}`;
    };

    let sessionId;
    let isUnique = false;
    while (!isUnique) {
      sessionId = generateSessionId();
      const existingUser = await User.findOne({ sessionId });
      if (!existingUser) {
        isUnique = true;
      }
    }

    // Create new user
    const user = await User.create({
      username,
      sessionId,
      isOnline: true,
    });

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        sessionId: user.sessionId,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        onlineStatus: user.onlineStatus,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      res.status(400).json({ message: "Username already exists" });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
});

module.exports = router;
