const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const { authenticateToken } = require("../middleware/auth");
const {
  createConversation,
  getConversationDetails,
  getConversations
} = require("../controller/conversationController");

// Get all conversations for a user
router.get("/", authenticateToken, getConversations);

// Get conversation details
router.get("/:conversationId", authenticateToken, getConversationDetails);

// Create a conversation
router.post("/", authenticateToken, createConversation);

// Mark messages as read
router.post("/:conversationId/read", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Mark all messages as read
    const updated = await Conversation.findOneAndUpdate(
      { _id: conversationId },
      {
        $addToSet: {
          "messages.$[].readBy": userId
        }
      },
      { new: true }
    );

    res.json({ message: "Messages marked as read", conversation: updated });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Error marking messages as read" });
  }
});

module.exports = router;
