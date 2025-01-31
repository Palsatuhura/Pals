import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import websocketService from "../services/websocketService";
import chatService from "../services/chatService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { styled } from "@mui/material/styles";

const StyledChatMain = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  backgroundColor: "#0F1620",
  flex: 1,
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  margin: 0,
  padding: 0,
  width: "calc(100vw - 310px)",
  marginLeft: "310px",
});

const ChatHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  padding: "20px",
  borderBottom: "2px solid #1E2C3A",
  backgroundColor: "#17212B",
});

const ChatMessages = styled(Box)({
  flex: 1,
  overflowY: "auto",
  padding: "20px",
  backgroundColor: "#0F1620",
  "&::-webkit-scrollbar": { width: "6px" },
  "&::-webkit-scrollbar-track": { background: "#17212B" },
  "&::-webkit-scrollbar-thumb": { background: "#2B5278", borderRadius: "3px" },
});

const MessageBubbleContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "isSender",
})(({ isSender }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: isSender ? "flex-end" : "flex-start",
  marginBottom: "16px",
}));

const MessageContentContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "isSender",
})(({ isSender }) => ({
  maxWidth: "70%",
  padding: "12px 16px",
  borderRadius: "12px",
  backgroundColor: isSender ? "#2B5278" : "#1E2C3A",
  color: "#fff",
}));

const ChatInputArea = styled(Box)({
  display: "flex",
  alignItems: "center",
  padding: "16px 20px",
  gap: "12px",
  borderTop: "2px solid #1E2C3A",
  backgroundColor: "#17212B",
});

const StyledInput = styled(TextField)({
  flex: 1,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#242F3D",
    color: "#fff",
    borderRadius: "8px",
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2B5278" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#2B5278",
    },
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
  "& .MuiInputBase-input::placeholder": { color: "#6C7883", opacity: 1 },
});

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return `rgb(${[hash % 256, (hash / 256) % 256, (hash / 65536) % 256]
    .map(Math.abs)
    .join(",")})`;
};

const formatUsername = (username) => {
  if (!username) return "";
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
};

const ChatMain = ({ conversation, friend, user }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Socket initialization
  useEffect(() => {
    let mounted = true;

    const initSocket = async () => {
      try {
        await websocketService.connect();
        const socketInstance = await websocketService.getSocket();
        if (mounted) {
          setSocket(socketInstance);
        }
      } catch (error) {
        console.error("Socket initialization error:", error);
      }
    };

    initSocket();

    return () => {
      mounted = false;
      if (socket) {
        websocketService.disconnect();
      }
    };
  }, []);

  // Real-time online status updates
  useEffect(() => {
    if (!socket || !friend?._id) return;

    const handleStatusUpdate = (data) => {
      if (data.userId === friend._id) {
        console.log(`Status update for ${friend.username}: ${data.status}`);
        setIsOnline(data.status === "online");
        if (data.status !== "online") {
          setLastSeen(new Date());
        }
      }
    };

    // Listen for status changes
    socket.on("user_status_change", handleStatusUpdate);

    // Get initial status
    const checkInitialStatus = async () => {
      try {
        const status = await websocketService.getUserStatus(friend._id);
        if (status) {
          console.log(`Initial status for ${friend.username}: ${status.status}`);
          setIsOnline(status.status === "online");
          setLastSeen(status.lastActive);
        }
      } catch (error) {
        console.error("Error checking initial status:", error);
      }
    };

    // Check status immediately and on reconnection
    checkInitialStatus();
    socket.on("connect", checkInitialStatus);

    return () => {
      socket.off("user_status_change", handleStatusUpdate);
      socket.off("connect", checkInitialStatus);
    };
  }, [socket, friend?._id, friend?.username]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      if (conversation?._id) {
        setLoading(true);
        try {
          const res = await api.get(`/messages/${conversation._id}`);
          // Ensure messages is always an array
          setMessages(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
          console.error("Error loading messages:", error);
          toast.error("Failed to load messages");
          setMessages([]); // Reset to empty array on error
        } finally {
          setLoading(false);
        }
      }
    };
    loadMessages();
  }, [conversation]);

  // Real-time message handling
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages((prev) =>
        prev.map((m) => (m.tempId === message.tempId ? message : m))
      );
      scrollToBottom();
    };

    socket.on("receive_message", handleNewMessage);
    return () => socket.off("receive_message", handleNewMessage);
  }, [socket]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim() || !conversation?._id) return;

    const tempMessage = {
      tempId: `temp-${Date.now()}`,
      content: message.trim(),
      sender: user,
      conversation: conversation._id,
      createdAt: new Date(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setMessage("");
    scrollToBottom();

    try {
      await websocketService.sendMessage({
        conversationId: conversation._id,
        content: message.trim(),
        tempId: tempMessage.tempId,
      });

      await chatService.saveMessage({
        content: message.trim(),
        conversationId: conversation._id,
        senderId: user._id,
      });
    } catch (error) {
      setMessages((prev) =>
        prev.filter((m) => m.tempId !== tempMessage.tempId)
      );
      toast.error("Failed to send message");
    }
  };

  // Conversation management
  useEffect(() => {
    const manageConversation = async () => {
      if (!conversation?._id) return;

      try {
        if (socket) {
          await websocketService.joinConversation(conversation._id);
        }
      } catch (error) {
        console.error("Conversation error:", error);
      }
    };

    manageConversation();

    return () => {
      if (conversation?._id) {
        websocketService.leaveConversation(conversation._id);
      }
    };
  }, [conversation?._id, socket]);

  // Formatting functions
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Online";

    const lastSeenDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Determine day label
    let dayLabel;
    if (lastSeenDate.toDateString() === today.toDateString()) {
      dayLabel = "today";
    } else if (lastSeenDate.toDateString() === yesterday.toDateString()) {
      dayLabel = "yesterday";
    } else {
      dayLabel = lastSeenDate
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();
    } // Format time (3:03pm)
    const timeString = lastSeenDate
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase()
      .replace(" ", ""); // Remove space between time and am/pm

    return `Last seen ${dayLabel} at ${timeString}`;
  };

  const formatMessageTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const generateColorFromString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return `rgb(${[hash % 256, (hash / 256) % 256, (hash / 65536) % 256]
      .map(Math.abs)
      .join(",")})`;
  };

  if (!conversation || !friend) {
    return (
      <StyledChatMain>
        <Box sx={styles.placeholder}>
          <Typography variant="h6">
            {!conversation ? "Select a conversation" : "Friend not found"}
          </Typography>
        </Box>
      </StyledChatMain>
    );
  }

  return (
    <StyledChatMain>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <ChatHeader>
        <Avatar
          sx={{
            bgcolor: stringToColor(friend?.username || ""),
            width: 40,
            height: 40,
            marginRight: 2,
          }}
        >
          {friend?.username?.[0]?.toUpperCase() || "?"}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ color: "#fff" }}>
            {formatUsername(friend?.username)}
          </Typography>
          <Typography variant="body2" sx={{ color: "#ceed9f" }}>
            {isOnline ? "Online" : `${formatLastSeen(lastSeen)}`}
          </Typography>
        </Box>
        <IconButton sx={{ color: "#6c7883" }}>
          <MoreVertIcon />
        </IconButton>
      </ChatHeader>

      <ChatMessages>
        {loading ? (
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : !messages?.length ? (
          <Box sx={styles.placeholder}>
            <Typography
              variant="h6"
              color="primary"
              sx={{ mb: 1, textAlign: "center" }}
            >
              🎉 You're now friends with {formatUsername(friend?.username)}!
            </Typography>
            <Typography
              variant="body1"
              color="#fff"
              sx={{ textAlign: "center" }}
            >
              Send them a message to start your conversation.
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id || msg.tempId}
              msg={msg}
              user={user}
              formatMessageTime={formatMessageTime}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </ChatMessages>

      <ChatInputArea component="form" onSubmit={handleSendMessage}>
        <StyledInput
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) =>
            e.key === "Enter" && !e.shiftKey && handleSendMessage(e)
          }
          placeholder="Type a message..."
          multiline
          maxRows={4}
        />
        <IconButton
          type="submit"
          disabled={!message.trim()}
          sx={styles.sendButton(message)}
        >
          <SendIcon />
        </IconButton>
      </ChatInputArea>
    </StyledChatMain>
  );
};

const MessageBubble = ({ msg, user, formatMessageTime }) => {
  const isSender = msg.sender?._id === user?._id;

  return (
    <MessageBubbleContainer isSender={isSender}>
      <MessageContentContainer isSender={isSender}>
        <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
          {msg.content}
        </Typography>
        <Typography variant="caption" sx={styles.messageTime(isSender)}>
          {formatMessageTime(msg.createdAt)}
        </Typography>
      </MessageContentContainer>
    </MessageBubbleContainer>
  );
};

const styles = {
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#6C7883",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  messageTime: (isSender) => ({
    display: "block",
    color: "#6c7883",
    mt: 1,
    textAlign: isSender ? "right" : "left",
  }),
  sendButton: (message) => ({
    color: message.trim() ? "#2B5278" : "#6c7883",
    "&:hover": { bgcolor: "rgba(43, 82, 120, 0.1)" },
  }),
};

export default ChatMain;
