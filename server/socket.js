const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

const setupSocket = (io) => {
  const onlineUsers = {};
  const userSockets = {};

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token)
        return next(new Error("Authentication error: Token required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded._id);
      if (!user) return next(new Error("User not found"));

      //Attach user to socket
      socket.userId = user._id;
      socket.username = user.username;

      next();
    } catch (err) {
      next(new Error("Authentication failed: " + err.message));
    }
  });

  io.on("connection", async (socket) => {
    console.log("New client connected");

    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastActive: new Date(),
      onlineStatus: "online",
    })
      .exec()
      .then((user) => {
        onlineUsers[socket.userId] = true;
        userSockets[socket.userId] = socket.id;
        io.emit("user_status_change", {
          userId: socket.userId,
          status: "online",
          lastActive: new Date(),
        });
      });

    socket.on("login", (userId) => {
      console.log("User logged in:", userId);
      onlineUsers[userId] = true;
      userSockets[userId] = socket.id;

      // Join user's room
      socket.join(userId);
      io.emit("userOnline", userId);
    });

    socket.on("joinConversation", (conversationId) => {
      console.log(
        `User ${socket.userId} joining conversation:`,
        conversationId
      );
      socket.join(conversationId);
    });

    socket.on("leaveConversation", (conversationId) => {
      console.log(
        `User ${socket.userId} leaving conversation:`,
        conversationId
      );
      socket.leave(conversationId);
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.userId);
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          onlineStatus: "offline",
          lastActive: new Date(),
        });

        io.emit("user_status_change", {
          userId: socket.userId,
          status: "offlins",
          lastActive: new Date(),
        });

        delete onlineUsers[socket.userId];
        delete userSockets[socket.userId];
      }
    });

    socket.on("getOnlineUsers", () => {
      socket.emit("onlineUsers", Object.keys(onlineUsers));
    });

    socket.on("update_status", async ({ status }) => {
      try {
        const user = await User.findByIdAndUpdate(
          socket.userId,
          {
            onlineStatus: status,
            lastActive: new Date(),
            isOnline: status !== "offline",
          },
          { new: true }
        );

        io.emit("user_status_change", {
          userId: user._id,
          status: user.onlineStatus,
          lastActive: user.lastActive,
        });
      } catch (error) {
        console.error("status update error: ", error);
      }
    });

    // Handle new message
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, content, replyTo } = data;

        // Create and save the message
        const message = new Message({
          conversation: conversationId,
          sender: socket.userId,
          content,
          replyTo,
          readBy: [socket.userId],
        });
        await message.save();

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          $inc: { messageCount: 1 },
        });

        // Populate message with sender details
        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username")
          .populate("replyTo");

        // Emit to all users in the conversation
        io.to(conversationId).emit("new_message", {
          message: populatedMessage,
          conversationId,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", {
          error: "Failed to send message",
        });
      }
    });

    // Handle typing status
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit("user_typing", {
        userId: socket.userId,
        username: socket.username,
        isTyping,
      });
    });

    // Handle message read status
    socket.on("mark_read", async ({ conversationId, messageId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: socket.userId },
        });

        socket.to(conversationId).emit("message_read", {
          messageId,
          userId: socket.userId,
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    //Get user status handler
    socket.on("get_user_status", async (userId) => {
      const user = await User.findById(userId);
      if (user) {
        socket.emit("user_status", {
          userId: user._id,
          status: onlineUsers[user._id] ? "online" : "offline",
          lastActive: user.lastActive,
          isOnline: user.isOnline,
        });
      }
    });

    // Handle sending message
    socket.on("send message", async ({ conversationId, content }) => {
      try {
        // save to database
        const newMessage = await Message.create({
          content,
          sender: socket.userId,
          conversation: conversationId,
        });

        // send acknowledgement
        // ack({ ststus: "success", tempId });

        // populate sender info
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("sender", "username avatar")
          .lean();

        io.to(conversationId).emit("receive_message", populatedMessage, tempId);
      } catch (err) {
        console.error("Error sending message:", err);
        socket.emit("message_error", { error: "Failed to send message" });
        // ack({ status: "error", tempId });
      }
    });
  });

  // Attach to io instance for access in routes
  io.onlineUsers = onlineUsers;
  io.userSockets = userSockets;

  return io;
};

module.exports = setupSocket;
