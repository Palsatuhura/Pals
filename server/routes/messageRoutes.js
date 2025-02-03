const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/attachments");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Send a message
router.post("/:conversationId", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    }).populate('participants');

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Create and save the new message
    const message = new Message({
      content,
      sender: userId,
      conversation: conversationId,
    });

    await message.save();

    // Populate sender info
    await message.populate({
      path: 'sender',
      select: 'username'
    });

    // Convert to plain object for socket emission
    const messageObj = message.toObject();

    // Get io instance
    const io = req.app.get('io');
    if (io) {
      // Emit to conversation room
      io.to(conversationId).emit('newMessage', messageObj);
    }

    // Update conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    res.status(201).json({ message: messageObj });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
});

// Update message status
router.put("/:messageId/status", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only update status if user is the recipient
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    message.status = status;
    await message.save();

    // Emit socket event for status update
    req.app.get("io").to(message.conversationId).emit("messageStatus", {
      messageId: message._id,
      status,
    });

    res.json({ message });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating message status", error: error.message });
  }
});

// Add reaction to message
router.post("/:messageId/reactions", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Remove existing reaction from this user if any
    message.reactions = message.reactions.filter(
      (reaction) => !reaction.userId.equals(req.user._id)
    );

    // Add new reaction
    message.reactions.push({
      userId: req.user._id,
      emoji,
    });

    await message.save();

    // Emit socket event for reaction update
    req.app.get("io").to(message.conversationId).emit("messageReaction", {
      messageId: message._id,
      reactions: message.reactions,
    });

    res.json({ message });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding reaction", error: error.message });
  }
});

// Delete message
router.delete("/:messageId", authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only allow deletion if user is the sender
    if (!message.senderId.equals(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await message.remove();

    // Emit socket event for message deletion
    req.app
      .get("io")
      .to(message.conversationId)
      .emit("messageDeleted", messageId);

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting message", error: error.message });
  }
});

// Get all messages for a conversation
router.get("/:conversationId", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Get messages with populated sender info
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ message: "Error getting messages" });
  }
});

//get messages for a conversation
router.get("/:conversationId/messages", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

//Get conversation detail
router.get("/:conversationId/detail", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log(`conversation Id ${conversationId}`);
    const conversation = await Conversation.findById(conversationId)
      .populate({ path: "participants", select: "username avatar status" })
      .populate({
        path: "lastMessages",
        populate: {
          path: "sender",
          select: "username avatar",
        },
      });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Route for sending messages
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const { content, attachments, conversationId, sender } = req.body;
    const messageData = { content, attachments, conversation: conversationId, sender };

    // Process message and save it
    const message = await Message.create(messageData);

    res.status(200).json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Route for uploading files
router.post("/upload", authenticateToken, upload.array("files"), async (req, res) => {
  try {
    const uploadedFiles = req.files;

    res.status(200).json(uploadedFiles);
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ message: "Failed to upload files" });
  }
});

// Route for subscribing to push notifications
router.post("/notifications/subscribe", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from token
    const subscription = req.body.subscription;

    // Update user with new subscription
    await User.findByIdAndUpdate(userId, {
      $addToSet: { pushSubscriptions: subscription }, // Prevent duplicates
    });

    res.status(200).json({ message: "Subscribed successfully" });
  } catch (error) {
    console.error("Error subscribing to notifications:", error);
    res.status(500).json({ message: "Failed to subscribe" });
  }
});

module.exports = router;
