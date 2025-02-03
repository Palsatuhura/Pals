import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import ChatSidebar from "../components/ChatSidebar";
import ChatMain from "../components/ChatMain";
import chatService from "../services/chatService";
import { showNotification } from "../utils/notificationUtils";
import { io } from "socket.io-client";

const Chat = () => {
  const navigate = useNavigate();
  const [conversationsList, setConversationsList] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userStatuses, setUserStatuses] = useState({});
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      const newSocket = io(import.meta.env.VITE_WS_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      newSocket.on("connect", () => {
        console.log("Socket connected");
        const userId = localStorage.getItem("userId");
        newSocket.emit("login", userId);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        showNotification("Connection error", "error");
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, []);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const user = JSON.parse(localStorage.getItem("user"));
        setUser(user);
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await chatService.getConversations();
        console.log("Loaded conversations:", response.data.conversations);

        if (response?.data?.conversations) {
          // Add friend info to each conversation
          const conversationsWithFriends = response.data.conversations.map((conv) => {
            const friend = conv?.participants?.find?.((p) => p?._id !== user?._id);
            return {
              ...conv,
              friend: friend || null,
            };
          });
          setConversationsList(conversationsWithFriends);

          // Get unique user IDs from all conversations
          const userIds = new Set();
          response.data.conversations.forEach((conv) => {
            conv.participants.forEach((p) => userIds.add(p._id));
          });

          // Fetch user statuses
          if (userIds.size > 0) {
            const statuses = await chatService.getUserStatuses([...userIds]);
            setUserStatuses(statuses);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading conversations:", error);
        showNotification("Failed to load conversations", "error");
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // Join conversation rooms when list is loaded
  useEffect(() => {
    if (!socket || !conversationsList.length) return;

    // Join all conversation rooms
    conversationsList.forEach(conversation => {
      socket.emit("joinConversation", conversation._id);
    });

    return () => {
      conversationsList.forEach(conversation => {
        socket.emit("leaveConversation", conversation._id);
      });
    };
  }, [socket, conversationsList]);

  useEffect(() => {
    if (!socket) return;

    const handleOnline = (userId) => {
      setUserStatuses(prev => ({ ...prev, [userId]: true }));
    };

    const handleOffline = (userId) => {
      setUserStatuses(prev => ({ ...prev, [userId]: false }));
    };

    socket.on('userOnline', handleOnline);
    socket.on('userOffline', handleOffline);
    socket.emit('getOnlineUsers');

    return () => {
      socket.off('userOnline', handleOnline);
      socket.off('userOffline', handleOffline);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewConversation = (newConversation) => {
      console.log("New conversation received:", newConversation);
      setConversationsList((prev) => {
        // Check if conversation already exists
        const exists = prev.some((conv) => conv._id === newConversation._id);
        if (exists) return prev;

        const updated = [...prev, newConversation];
        return updated.sort((a, b) => {
          const timeA = a.lastMessage
            ? new Date(a.lastMessage.createdAt)
            : new Date(0);
          const timeB = b.lastMessage
            ? new Date(b.lastMessage.createdAt)
            : new Date(0);
          return timeB - timeA;
        });
      });
    };

    const handleMessageReceived = (message) => {
      setConversationsList((prev) =>
        prev
          .map((conv) => {
            if (conv._id === message.conversationId) {
              return {
                ...conv,
                messages: [...(conv.messages || []), message],
                lastMessage: message,
                unreadCount:
                  currentConversation?._id !== conv._id
                    ? (conv.unreadCount || 0) + 1
                    : 0,
              };
            }
            return conv;
          })
          .sort((a, b) => {
            const timeA = a.lastMessage
              ? new Date(a.lastMessage.createdAt)
              : new Date(0);
            const timeB = b.lastMessage
              ? new Date(b.lastMessage.createdAt)
              : new Date(0);
            return timeB - timeA;
          })
      );

      // Update current conversation if it's the active one
      if (currentConversation?._id === message.conversationId) {
        setCurrentConversation((prev) => ({
          ...prev,
          messages: [...(prev.messages || []), message],
          lastMessage: message,
          unreadCount: 0,
        }));
      }
    };

    const handleUserStatusUpdate = ({ userId, status, lastActive }) => {
      console.log("Status update received at Chat.jsx:", {
        userId,
        status,
        lastActive,
      });
      setUserStatuses((prev) => ({
        ...prev,
        [userId]: { status, lastActive: new Date(lastActive) },
      }));
    };

    socket.on("conversationAdded", handleNewConversation);
    socket.on("newMessage", handleMessageReceived);
    socket.on("userStatusUpdate", handleUserStatusUpdate);

    return () => {
      socket.off("conversationAdded", handleNewConversation);
      socket.off("newMessage", handleMessageReceived);
      socket.off("userStatusUpdate", handleUserStatusUpdate);
    };
  }, [socket, currentConversation]);

  const handleMessageSent = async (message) => {
    if (!currentConversation?._id) {
      console.error("No active conversation");
      return;
    }

    try {
      // Send message through WebSocket
      socket.emit("sendMessage", currentConversation._id, message);

      // Optimistically update UI
      const newMessage = {
        _id: Date.now().toString(), // Temporary ID
        conversationId: currentConversation._id,
        sender: user._id,
        content: message,
        createdAt: new Date().toISOString(),
      };

      // Update conversations list
      setConversationsList((prevConvs) =>
        prevConvs.map((conv) => {
          if (conv._id === currentConversation._id) {
            return {
              ...conv,
              messages: [...(conv.messages || []), newMessage],
              lastMessage: newMessage,
            };
          }
          return conv;
        })
      );

      // Update current conversation
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), newMessage],
        lastMessage: newMessage,
      }));
    } catch (error) {
      console.error("Error sending message:", error);
      showNotification("Failed to send message", "error");
    }
  };

  const handleConversationSelect = (conversation) => {
    console.log("Selected conversation:", conversation);
    setCurrentConversation(conversation);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#0f1620",
        }}
      >
        <CircularProgress sx={{ color: "#2b5278" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#0f1620",
          color: "#fff",
        }}
      >
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ChatSidebar
          conversations={conversationsList}
          selectedConversation={currentConversation}
          onConversationSelect={handleConversationSelect}
          socket={socket}
          loading={loading}
        />
        <ChatMain 
          selectedConversation={currentConversation}
          socket={socket}
          onMessageSent={handleMessageSent}
        />
      </Box>
    </Box>
  );
};

export default Chat;
