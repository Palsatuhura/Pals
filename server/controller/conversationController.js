const Conversation = require("../models/Conversation");
const User = require("../models/User");

// Create new conversation
const createConversation = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Friend's session ID is required" });
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
        conversation: existingConversation,
      });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [req.user._id, friend._id],
      lastMessage: null,
    });

    await conversation.save();

    // Populate the conversation with participant details
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "username sessionId status lastActive");

    res.json({
      message: "Conversation created successfully",
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ message: "Error creating conversation" });
  }
};

// Get conversation details
const getConversationDetails = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    })
      .populate("participants", "username sessionId status lastActive")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username"
        }
      });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Add friend details
    const conversationObj = conversation.toObject();
    const friend = conversation.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );
    
    if (friend) {
      conversationObj.friend = {
        _id: friend._id,
        username: friend.username,
        status: friend.status,
        lastActive: friend.lastActive,
      };
    }

    res.json(conversationObj);
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ message: "Error getting conversation" });
  }
};

// Get all conversations for user
const getConversations = async (req, res) => {
  try {
    console.log("Fetching conversations for user:", req.user._id);

    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username sessionId status lastActive")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username"
        }
      })
      .sort({ updatedAt: -1 });

    console.log("Found conversations:", conversations.length);

    // Transform conversations to include friend info
    const conversationsWithDetails = conversations.map((conv) => {
      const convObj = conv.toObject();
      
      // Add friend details
      const friend = conv.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      
      if (friend) {
        convObj.friend = {
          _id: friend._id,
          username: friend.username,
          status: friend.status,
          lastActive: friend.lastActive,
        };
      }

      return convObj;
    });

    res.json(conversationsWithDetails);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Error getting conversations" });
  }
};

module.exports = {
  createConversation,
  getConversationDetails,
  getConversations,
};
