import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import ChatSidebar from "../components/ChatSidebar";
import ChatMain from "../components/ChatMain";
import websocketService from "../services/websocketService";
import chatService from "../services/chatService";
import toast from "react-hot-toast";

const Chat = () => {
  const navigate = useNavigate();
  const [conversationsList, setConversationsList] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userStatuses, setUserStatuses] = useState({});
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Auth check and socket initialization
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        // Initialize socket connection
        await websocketService.connect();
        const socket = await websocketService.getSocket();
        if (socket) {
          setSocket(socket);

          // Join user's room for direct notifications
          const user = JSON.parse(localStorage.getItem("user"));
          setUser(user);
          if (user?._id) {
            socket.emit("joinUserRoom", { userId: user._id });
          }
        }

        // Fetch conversations
        await fetchConversations();
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/");
      }
    };

    checkAuth();

    return () => {
      websocketService.disconnect();
    };
  }, [navigate]);

  const fetchConversations = async () => {
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
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Socket event listeners
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

  useEffect(() => {
    const socket = websocketService.socket;
    if (socket) {
      // Join all conversation rooms
      conversationsList.forEach((conv) => {
        socket.emit("joinConversation", { conversationId: conv._id });
      });
    }

    return () => {
      // Leave all conversation rooms
      conversationsList.forEach((conv) => {
        socket.emit("leaveConversation", { conversationId: conv._id });
      });
    };
  }, [conversationsList]);

  const handleMessageSent = async (message) => {
    if (!currentConversation?._id) {
      console.error("No active conversation");
      return;
    }

    try {
      // Send message through WebSocket
      websocketService.sendMessage(currentConversation._id, message);

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
      toast.error("Failed to send message");
    }
  };

  const handleConversationSelect = async (conversation) => {
    try {
      console.log("Selected conversation:", conversation);
      // Mark conversation as read
      if (conversation.unreadCount > 0) {
        await chatService.markConversationAsRead(conversation._id);
        setConversationsList((prevConvs) =>
          prevConvs.map((conv) =>
            conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv
          )
        );
      }

      setCurrentConversation(conversation);
    } catch (error) {
      console.error("Error selecting conversation:", error);
    }
  };

  const handleNewConversation = async (newConversation) => {
    try {
      // Notify other participant using websocketService
      await websocketService.emit("newConversation", { conversation: newConversation });

      setConversationsList((prev) => {
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
      setCurrentConversation(newConversation);
    } catch (error) {
      console.error("Error handling new conversation:", error);
    }
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
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#0f1620",
      }}
    >
      <ChatSidebar
        conversations={conversationsList}
        currentConversation={currentConversation}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
        userStatuses={userStatuses}
        loading={loading}
      />
      <Box sx={{ flex: 1, display: "flex" }}>
        {currentConversation ? (
          <ChatMain
            conversation={currentConversation}
            friend={currentConversation?.friend || null}
            user={user}
          />
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#17212B",
              width: "69rem",
            }}
          >
            <Typography variant="h6" sx={{ color: "#fff" }}>
              Select a conversation
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Chat;
