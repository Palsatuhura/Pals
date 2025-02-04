import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, IconButton, useMediaQuery, useTheme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChatSidebar from "../components/ChatSidebar";
import ChatMain from "../components/ChatMain";
import chatService from "../services/chatService";
import { showNotification } from "../utils/notificationUtils";
import { io } from "socket.io-client";
import { styled } from '@mui/material/styles';

const ChatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  height: "100%",
  width: "100%",
  position: "relative",
  overflow: "hidden",
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down('md')]: {
    flexDirection: "column",
  }
}));

const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => !['isMobile', 'showSidebar'].includes(prop)
})(({ theme, isMobile, showSidebar }) => ({
  width: "310px",
  height: "100%",
  borderRight: `1px solid ${theme.palette.background.divider}`,
  backgroundColor: theme.palette.background.paper,
  position: isMobile ? "absolute" : "relative",
  left: 0,
  top: 0,
  bottom: 0,
  zIndex: 2,
  transition: "transform 0.3s ease-in-out",
  transform: isMobile && !showSidebar ? "translateX(-100%)" : "translateX(0)",
  [theme.breakpoints.down('md')]: {
    width: "100%"
  }
}));

const MainContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isMobile'
})(({ theme, isMobile }) => ({
  flex: 1,
  height: "100%",
  position: "relative",
  [theme.breakpoints.down('md')]: {
    width: "100%",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1
  }
}));

const Chat = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [conversationsList, setConversationsList] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userStatuses, setUserStatuses] = useState({});
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      console.log("Auth check - token:", token);
      console.log("Auth check - userData:", userData);

      if (!token || !userData) {
        console.error("Missing auth data");
        navigate("/");
        return;
      }

      try {
        const user = JSON.parse(userData);
        console.log("Auth check - parsed user:", user);
        
        if (!user?._id) {
          throw new Error("Invalid user data");
        }
        setUser(user);
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  // Initialize socket connection
  useEffect(() => {
    let socketInstance = null;

    const initSocket = () => {
      if (!user?._id) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        socketInstance = io(import.meta.env.VITE_WS_URL, {
          withCredentials: true,
          transports: ['websocket'],
          auth: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5
        });

        socketInstance.on("connect", () => {
          console.log("Socket connected");
          setIsConnected(true);
          socketInstance.emit("login", user._id);
        });

        socketInstance.on("disconnect", () => {
          console.log("Socket disconnected");
          setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          setIsConnected(false);
          showNotification({
            message: "Connection error. Retrying...",
            severity: "warning"
          });
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error("Socket initialization error:", error);
        showNotification({
          message: "Failed to establish connection",
          severity: "error"
        });
      }
    };

    initSocket();

    return () => {
      if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.close();
      }
    };
  }, [user]);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user?._id) return;
      
      try {
        setLoading(true);
        const response = await chatService.getConversations();
        console.log("Loaded conversations:", response.data);

        if (Array.isArray(response?.data)) {
          const conversationsWithFriends = response.data.map((conv) => {
            const participants = conv.participants || [];
            const friend = participants.find(p => p._id !== user._id) || {};
            return {
              ...conv,
              friend
            };
          });

          setConversationsList(conversationsWithFriends);

          // Initialize online status for all users
          const userIds = new Set();
          conversationsWithFriends.forEach(conv => {
            if (conv.friend?._id) {
              userIds.add(conv.friend._id);
            }
          });

          const initialStatuses = {};
          userIds.forEach(id => {
            initialStatuses[id] = false;
          });
          setUserStatuses(initialStatuses);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        showNotification({
          message: "Failed to load conversations",
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // Handle socket events for user status updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("user_status_change", ({ userId, status }) => {
      setUserStatuses(prev => ({
        ...prev,
        [userId]: status === "online"
      }));
    });

    socket.on("new_message", (message) => {
      // Update conversations list with new message
      setConversationsList(prev => {
        return prev.map(conv => {
          if (conv._id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message
            };
          }
          return conv;
        });
      });
    });

    return () => {
      socket.off("user_status_change");
      socket.off("new_message");
    };
  }, [socket, isConnected]);

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setCurrentConversation(conversation);
    if (isMobile) {
      setShowSidebar(false);
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
          backgroundColor: theme.palette.background.default
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ChatContainer>
      <SidebarContainer isMobile={isMobile} showSidebar={showSidebar}>
        <ChatSidebar
          conversations={conversationsList}
          selectedConversation={currentConversation}
          onConversationSelect={handleConversationSelect}
          onlineUsers={userStatuses}
          loading={loading}
          user={user}
        />
      </SidebarContainer>
      
      <MainContainer isMobile={isMobile}>
        {currentConversation ? (
          <ChatMain
            conversation={currentConversation}
            socket={socket}
            onlineUsers={userStatuses}
            isConnected={isConnected}
            user={user}
            onBackClick={isMobile ? toggleSidebar : undefined}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.secondary
            }}
          >
            <Typography variant="h6">Select a conversation to start chatting</Typography>
          </Box>
        )}
      </MainContainer>
    </ChatContainer>
  );
};

export default Chat;
