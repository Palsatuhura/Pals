import React, { useState, useEffect, useRef, useContext } from "react";
import { Box, TextField, IconButton, Typography, Paper } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import SendIcon from "@mui/icons-material/Send";
import { showNotification } from "../utils/notificationUtils";
import chatService from "../services/chatService";
import { SocketContext } from "../App";
import MessageBubble from "./MessageBubble";
import { styled } from "@mui/material/styles";
import { format } from "date-fns";
import { formatUsername, generateAvatarColor } from "../utils/formatUsername";

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

const ChatHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: "20px",
  borderBottom: "2px solid #1E2C3A",
  backgroundColor: "#17212B",
  justifyContent: "space-between",
}));

const ChatMessages = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: "20px 0",
  backgroundColor: "#0F1620",
  "&::-webkit-scrollbar": {
    width: "6px",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  "&::-webkit-scrollbar-track": {
    background: "#17212B",
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#2B5278",
    borderRadius: "3px",
    "&:hover": {
      background: "#3A6A9A",
    },
  },
}));

const ChatInput = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: "16px 20px",
  gap: "12px",
  borderTop: "2px solid #1E2C3A",
  backgroundColor: "#17212B",
}));

const StyledTextField = styled(TextField)({
  flex: 1,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#242F3D",
    color: "#fff",
    borderRadius: "8px",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#2B5278",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#2B5278",
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#6C7883",
    opacity: 1,
  },
});

const ChatMain = ({ selectedConversation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = useContext(SocketContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation?._id) {
        setMessages([]);
        return;
      }

      setLoading(true);
      try {
        const response = await chatService.getMessages(
          selectedConversation._id
        );
        // Ensure we have an array of messages
        const messageArray = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.messages)
          ? response.data.messages
          : [];
        setMessages(messageArray);
        scrollToBottom();
      } catch (error) {
        console.error("Error loading messages:", error);
        showNotification("Failed to load messages", "error");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [selectedConversation?._id]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !selectedConversation?._id) return;

    console.log(
      "Setting up socket listeners for conversation:",
      selectedConversation._id
    );

    // Join conversation room
    socket.emit("joinConversation", selectedConversation._id);

    const handleNewMessage = (message) => {
      console.log("Received new message:", message);
      if (message.conversation === selectedConversation._id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.emit("leaveConversation", selectedConversation._id);
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedConversation?._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation?._id) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const response = await chatService.sendMessage(
        selectedConversation._id,
        messageContent
      );
      console.log("Message sent:", response.data);

      // Message will be added through socket event
    } catch (error) {
      console.error("Error sending message:", error);
      showNotification("Failed to send message", "error");
      setNewMessage(messageContent);
    }
  };

  if (!selectedConversation) {
    return (
      <StyledChatMain>
        <Typography
          variant="h6"
          sx={{ p: 3, textAlign: "center", color: "#6C7883" }}
        >
          Select a conversation to start chatting
        </Typography>
      </StyledChatMain>
    );
  }

  const friendId = selectedConversation.participants.find(
    (id) => id !== localStorage.getItem("userId")
  );
  const isOnline = socket?.onlineUsers?.hasOwnProperty(friendId);
  const username = selectedConversation.friend?.username || "Unknown User";

  return (
    <StyledChatMain>
      <ChatHeader>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: generateAvatarColor(username[0]),
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              fontSize: "1.25rem",
            }}
          >
            {formatUsername(username)}
          </Box>
          <Box>
            <Typography variant="h6">{username}</Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: isOnline ? "#4caf50" : "#757575",
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: isOnline ? "#4caf50" : "#757575",
                }}
              />
              <Typography variant="body2">
                {isOnline ? "Online" : "Offline"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </ChatHeader>

      <ChatMessages>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.sender._id === localStorage.getItem("userId")}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </ChatMessages>

      <ChatInput component="form" onSubmit={handleSendMessage}>
        <StyledTextField
          fullWidth
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          variant="outlined"
          size="small"
        />
        <IconButton
          type="submit"
          disabled={!newMessage.trim()}
          sx={{
            color: newMessage.trim() ? "#2B5278" : "rgba(255, 255, 255, 0.3)",
            "&:hover": {
              backgroundColor: "rgba(43, 82, 120, 0.1)",
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </ChatInput>
    </StyledChatMain>
  );
};

export default ChatMain;
