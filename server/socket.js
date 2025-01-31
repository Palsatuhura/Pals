const jwt = require("jsonwebtoken");
const User = require("./models/User");

const setupSocket = (io) => {
  //Track active connections per user
  const connectedUsers = new Map();

  //Authentication middleware
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
    try {
      //update connection count
      const currentCount = connectedUsers.get(socket.userId) || 0;
      connectedUsers.set(socket.userId, currentCount + 1);

      //First connection - set online
      if (currentCount === 0) {
        await User.findByIdAndUpdate(socket.userId, {
          online: true,
          lastActive: null,
          isOnline: true,
        });

        io.emit("user_status_change", {
          userId: socket.userId,
          username: socket.username,
          status: "online",
          lastActive: null,
          isOnline: true,
        });
      }

      //Get user status handler
      socket.on("get_user_status", async (userId) => {
        const user = await User.findById(userId);
        if (user) {
          socket.emit("user_status", {
            userId: user._id,
            status: connectedUsers.has(user._id.toString())
              ? "online"
              : "offline",
            lastActive: user.lastActive,
            isOnline: user.isOnline,
          });
        }
      });

      //Disconnection handler
      socket.on("disconnect", async () => {
        try {
          const currentCount = connectedUsers.get(socket.userId) || 0;
          const newCount = Math.max(currentCount - 1, 0);

          connectedUsers.set(socket.userId, newCount);

          if (newCount === 0) {
            const updatedUser = await User.findByIdAndUpdate(
              socket.userId,
              {
                $set: {
                  online: false,
                  lastActive: Date.now(),
                  isOnline: false,
                },
              },
              { new: true }
            ).lean();

            io.emit("user_status_change", {
              userId: socket.userId,
              status: "offline",
              lastActice: updatedUser.lastActive,
              isOnline: false,
            });
          }
        } catch (err) {
          "Disconnect error: ", error;
        }
      });
    } catch (error) {
      console.error("Connection error:", error);
    }

    socket.on("send message", async ({ conversationId, content }) => {
      try {
        // save to database
        const newMessage = await Message.create({
          content,
          sender: socket.userId,
          conversation: conversationId,
        });

        // send acknowledgement
        ack({ ststus: "success", tempId });

        // populate sender info
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("sender", "username avatar")
          .lean();

        io.to(conversationId).emit("receive_message", populatedMessage, tempId);
      } catch (err) {
        console.error("Error sending message:", err);
        socket.emit("message_error", { error: "Failed to send message" });
        ack({ status: "error", tempId });
      }
    });
  });

  return io;
};

module.exports = setupSocket;
