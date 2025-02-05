const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation"); // Assuming Conversation model is defined in a separate file
const { generateToken, authenticateToken } = require("../middleware/auth");
const mongoose = require("mongoose");

// Helper function to generate custom session ID
const generateSessionId = (username) => {
  const prefix = username.substring(0, 2).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = new Date().toLocaleString("default", { month: "long" });
  const suffix = `${year}${month[0].toUpperCase()}`;
  return `${prefix}-${randomPart}-${suffix}`;
};

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const upperUsername = username.toUpperCase();

    // Check if username exists
    const existingUser = await User.findOne({ username: upperUsername });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // Generate custom session ID
    let sessionId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      sessionId = generateSessionId(upperUsername);
      // Check if sessionId exists
      const existingSession = await User.findOne({ sessionId });
      if (!existingSession) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        message: "Could not generate unique session ID. Please try again.",
      });
    }

    // Create new user
    const user = new User({
      username: upperUsername,
      sessionId,
      status: "online",
      lastActive: new Date(),
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: user._id.toString(),
        username: user.username,
        sessionId: user.sessionId,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      res
        .status(400)
        .json({ message: "Username or session ID already exists" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

// Login with session ID
router.post("/login", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const user = await User.findOne({ sessionId: sessionId.toUpperCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate token
    const token = generateToken(user);

    // Update user status
    await User.findByIdAndUpdate(user._id, {
      status: "online",
      lastActive: new Date(),
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id.toString(),
        username: user.username,
        sessionId: user.sessionId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

// Logout route
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        status: "offline",
        lastActive: new Date(),
      });
    }
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/status", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        onlineStatus: req.body.status,
        lastActive: new Date(),
        isOnline: req.body.status !== "offline",
      },
      { new: true }
    );

    req.app.get("io").emit("user_status_change", {
      userId: user._id,
      status: user.onlineStatus,
      lastActive: user.lastActive,
    });

    res.json({ status: user.onlineStatus });
  } catch (error) {
    res.status(500).json({ error: "Status update failed" });
  }
});

// Get user status

router.get("/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("userId: ", userId);

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await User.findById(userId).select("online lastActive").lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      online: user.online,
      lastActive: user.lastActive,
    });
  } catch (error) {
    console.error("Get user status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all usernames
router.get("/usernames", async (req, res) => {
  try {
    const users = await User.find({}, "username");
    const usernames = users.map((user) => user.username);
    res.json(usernames);
  } catch (error) {
    console.error("Error fetching usernames:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create conversation with friend
router.post("/conversation", authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res
        .status(400)
        .json({ message: "Friend's session ID is required" });
    }

    // Find friend by session ID
    const friend = await User.findOne({ sessionId: sessionId.toUpperCase() });
    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: {
        $all: [req.user._id, friend._id],
      },
    }).populate("participants", "username sessionId status lastActive");

    if (existingConversation) {
      return res.json({
        message: "Conversation already exists",
        conversation: {
          ...existingConversation.toObject(),
          unreadCount: 0,
        },
      });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [req.user._id, friend._id],
      messages: [],
      unreadCount: 0,
      lastMessage: null,
    });

    await conversation.save();

    // Populate the conversation with participant details
    const populatedConversation = await Conversation.findById(
      conversation._id
    ).populate("participants", "username sessionId status lastActive");

    req.app
      .get("io")
      .to([req.user._id.toString(), friend._id.toString()])
      .emit("conversation_created", {
        conversation: populatedConversation.toObject({ virtuals: true }),
      });

    res.json({
      message: "Conversation created successfully",
      conversation: {
        ...populatedConversation.toObject(),
        unreadCount: 0,
      },
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ message: "Error creating conversation" });
  }
});

module.exports = router;
