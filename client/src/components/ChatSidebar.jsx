import React, { useState, useEffect, useMemo } from "react";
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  IconButton,
  Badge,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Chip,
  InputAdornment,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import NewConversationDialog from "./NewConversationDialog";
import { formatDistanceToNow } from "date-fns";
import chatService from "../services/chatService";
import websocketService from "../services/websocketService";
import { formatLastSeen } from "../utils/timeUtils";
import axios from "axios";
import { toast } from "react-toastify";

const StyledSidebar = styled(Box)({
  width: "310px",
  borderRight: "1px solid #0f1620",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

const SearchBar = styled(Box)({
  padding: "15px",
  display: "flex",
  alignItems: "center",
  backgroundColor: "#242f3d",
  borderBottom: "1px solid #0f1620",
});

const SearchInput = styled("input")({
  flex: 1,
  backgroundColor: "#1c2733",
  border: "none",
  borderRadius: "20px",
  padding: "8px 15px 8px 35px",
  color: "#fff",
  outline: "none",
  "&::placeholder": {
    color: "#6c7883",
  },
});

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const OfflineBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#bdbdbd",
    color: "#bdbdbd",
    boxShadow: `0 0 0 2px`,
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      border: "1px solid currentColor",
      content: '""',
    },
  },
}));

const stringToColor = (string) => {
  if (!string) return "#757575"; // Default color for empty strings

  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    // Ensure the color is not too dark by setting a minimum value
    const adjustedValue = Math.max(value, 128);
    color += adjustedValue.toString(16).padStart(2, "0");
  }

  return color;
};

const formatUsername = (username) => {
  if (!username) return "";
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
};

const getFriend = (conversation, userId) => {
  if (!conversation?.participants || !userId) {
    console.log('Missing conversation participants or userId:', { conversation, userId });
    return null;
  }

  // First check if the conversation has a friend object from the server
  if (conversation.friend) {
    return conversation.friend;
  }
  
  // Fallback to finding friend in participants array
  const friend = conversation.participants.find(
    (p) => p?._id?.toString() !== userId?.toString()
  );
  
  if (!friend) {
    console.log('No friend found in conversation:', { 
      participants: conversation.participants,
      userId 
    });
  }
  
  return friend;
};

const ConversationItem = ({
  conversation,
  isSelected,
  onClick,
  onlineUsers,
  userId,
}) => {
  const friend = getFriend(conversation, userId);
  const isOnline = friend && onlineUsers[friend._id];

  return (
    <ListItem
      button
      selected={isSelected}
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "4px",
        backgroundColor: isSelected ? "#2b5278" : "transparent",
        "&:hover": {
          backgroundColor: isSelected ? "#2b5278" : "#182533",
        },
      }}
    >
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        variant="dot"
        sx={{
          "& .MuiBadge-badge": {
            backgroundColor: isOnline ? "#44b700" : "#6c7883",
            color: isOnline ? "#44b700" : "#6c7883",
            boxShadow: `0 0 0 2px #17212b`,
            "&::after": {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              animation: isOnline ? "ripple 1.2s infinite ease-in-out" : "none",
              border: "1px solid currentColor",
              content: '""',
            },
          },
          "@keyframes ripple": {
            "0%": {
              transform: "scale(.8)",
              opacity: 1,
            },
            "100%": {
              transform: "scale(2.4)",
              opacity: 0,
            },
          },
        }}
      >
        <Avatar
          sx={{
            bgcolor: stringToColor(friend?.username || ""),
            width: 40,
            height: 40,
            marginRight: 2,
          }}
        >
          {friend?.username?.[0]?.toUpperCase()}
        </Avatar>
      </Badge>
      <Box sx={{ ml: 2, flex: 1, overflow: "hidden" }}>
        <Typography
          variant="subtitle1"
          sx={{
            color: "#fff",
            fontWeight: "500",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {formatUsername(friend?.username || "Unknown User")}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#6c7883",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {conversation.lastMessage?.content || "No messages yet"}
        </Typography>
      </Box>
    </ListItem>
  );
};

const ChatSidebar = ({
  conversations,
  selectedConversation,
  onConversationSelect,
  onNewConversation,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);
  const [friendSessionId, setFriendSessionId] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [error, setError] = useState("");
  const [onlineUsers, setOnlineUsers] = useState({});
  const [user, setUser] = useState(() => {
    try {
      const userId = localStorage.getItem("userId");
      const username = localStorage.getItem("username");
      const sessionId = localStorage.getItem("sessionId");
      
      if (!userId) return null;
      
      return {
        _id: userId,
        username,
        sessionId
      };
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const userId = localStorage.getItem("userId");
        const username = localStorage.getItem("username");
        const sessionId = localStorage.getItem("sessionId");
        
        if (!userId) {
          setUser(null);
          return;
        }
        
        setUser({
          _id: userId,
          username,
          sessionId
        });
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [socket, setSocket] = useState(null);
  const [conversationsList, setConversations] = useState([]);
  const [loadingConversations, setLoading] = useState(false);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        if (!user?._id || !conversations?.length) return;

        await websocketService.connect();
        const socket = websocketService.getSocket();
        if (!socket) return;

        const checkAllParticipantsStatus = async () => {
          const friendIds = conversations
            .map(conv => getFriend(conv, user._id)?._id)
            .filter(Boolean);

          console.log("Checking status for friends:", friendIds);

          const statusPromises = friendIds.map(async (friendId) => {
            try {
              const status = await websocketService.getUserStatus(friendId);
              console.log(`Status for ${friendId}:`, status);
              return { userId: friendId, isOnline: status?.status === "online" };
            } catch (error) {
              console.error(`Error getting status for ${friendId}:`, error);
              return { userId: friendId, isOnline: false };
            }
          });

          const statuses = await Promise.all(statusPromises);
          const newOnlineUsers = {};
          statuses.forEach(({ userId, isOnline }) => {
            newOnlineUsers[userId] = isOnline;
          });

          console.log("Setting online users:", newOnlineUsers);
          setOnlineUsers(newOnlineUsers);
        };

        checkAllParticipantsStatus();

        const handleStatusChange = ({ userId, status }) => {
          console.log(`Real-time status change for ${userId}:`, status);
          setOnlineUsers(prev => ({
            ...prev,
            [userId]: status === "online"
          }));
        };

        socket.on("connect", () => {
          console.log("Socket reconnected, checking all statuses");
          checkAllParticipantsStatus();
        });

        socket.on("user_status_change", handleStatusChange);

        return () => {
          socket.off("connect");
          socket.off("user_status_change", handleStatusChange);
        };
      } catch (error) {
        console.error("Socket initialization error:", error);
      }
    };

    initializeSocket();
  }, [user?._id, conversations]);

  useEffect(() => {
    if (Array.isArray(conversations)) {
      setConversations(conversations);
    }
  }, [conversations]);

  const handleConversationClick = (conversation) => {
    console.log("Clicking conversation:", conversation);
    onConversationSelect(conversation);
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return "No conversations yet";
    if (!conversation.lastMessage.content) return "Media message";
    const content = String(conversation.lastMessage.content);
    return content.length > 30 ? content.substring(0, 30) + "..." : content;
  };

  const handleAddFriend = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await chatService.createConversation(friendSessionId);

      if (response && response.data?.conversation) {
        await websocketService.emit("newConversation", {
          conversation: response.data.conversation,
        });

        onNewConversation(response.data.conversation);
        setAddFriendDialogOpen(false);
        setFriendSessionId("");
      }
    } catch (error) {
      console.error("Error adding friend:", error);
      setError(error.response?.data?.message || "Failed to add friend");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      websocketService.disconnect();

      await chatService.logout();

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");

      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const fetchOnlineStatus = async () => {
      try {
        if (
          !conversationsList ||
          !Array.isArray(conversationsList) ||
          !user?._id
        ) {
          return;
        }

        const userIds = conversationsList
          .map((conv) => getFriend(conv, user._id)?._id)
          .filter(Boolean);

        if (userIds.length === 0) {
          return;
        }

        const response = await chatService.getUserStatuses(userIds);
        if (response?.users) {
          const onlineUserIds = response.users
            .filter((user) => user.status === "online")
            .map((user) => user._id);

          setOnlineUsers(
            onlineUserIds.reduce((acc, id) => ({ ...acc, [id]: true }), {})
          );
        }
      } catch (error) {
        console.error("Error fetching user statuses:", error);
        setError("Failed to fetch online status");
      }
    };

    if (conversationsList?.length > 0) {
      fetchOnlineStatus();
    }
  }, [conversationsList, user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/conversations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }

      const data = await response.json();
      console.log("Loaded conversations:", data);

      const sortedConversations = data.sort((a, b) => {
        const timeA = a.lastMessage
          ? new Date(a.lastMessage.createdAt)
          : new Date(0);
        const timeB = b.lastMessage
          ? new Date(b.lastMessage.createdAt)
          : new Date(0);
        return timeB - timeA;
      });

      setConversations(sortedConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();

    if (socket) {
      socket.on("newMessage", (message) => {
        setConversations((prevConversations) => {
          const updatedConversations = prevConversations.map((conv) => {
            if (conv._id === message.conversation) {
              return {
                ...conv,
                lastMessage: message,
                unreadCount: conv.unreadCount + 1,
              };
            }
            return conv;
          });

          return updatedConversations.sort((a, b) => {
            const timeA = a.lastMessage
              ? new Date(a.lastMessage.createdAt)
              : new Date(0);
            const timeB = b.lastMessage
              ? new Date(b.lastMessage.createdAt)
              : new Date(0);
            return timeB - timeA;
          });
        });
      });

      return () => {
        socket.off("newMessage");
      };
    }
  }, [socket]);

  const formatMessageTime = (date) => {
    if (!date) return "";
    return new Date(date)
      .toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  };

  const renderConversations = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!Array.isArray(conversationsList)) {
      console.error("Conversations list is not an array:", conversationsList);
      return null;
    }

    const filteredConversations = conversationsList.filter((conv) => {
      if (!conv?.friend?.username) return false;
      return conv.friend.username
        .toLowerCase()
        .includes((searchTerm || "").toLowerCase());
    });

    if (filteredConversations.length === 0) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            p: 3,
            textAlign: "center",
            color: "#6C7883",
          }}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            {searchTerm ? "No conversations found" : "No conversations yet"}
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddFriendDialogOpen(true)}
            sx={{
              bgcolor: "#2B5278",
              "&:hover": {
                bgcolor: "#1E2C3A",
              },
            }}
          >
            Add a Friend
          </Button>
        </Box>
      );
    }

    return (
      <List sx={{ p: 0 }}>
        {filteredConversations.map((conversation) => (
          <ListItem
            key={conversation._id}
            onClick={() => handleConversationClick(conversation)}
            sx={{
              cursor: "pointer",
              bgcolor: selectedConversation?._id === conversation._id ? "#2B5278" : "transparent",
              "&:hover": {
                bgcolor: selectedConversation?._id === conversation._id ? "#2B5278" : "#1E2C3A",
              },
              p: 2,
            }}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
                sx={{
                  "& .MuiBadge-badge": {
                    backgroundColor: onlineUsers[conversation.friend?._id] ? "#ceed9f" : "transparent",
                    boxShadow: onlineUsers[conversation.friend?._id]
                      ? `0 0 0 2px #17212b, 0 0 0 4px #ceed9f40`
                      : "none",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                    "&::after": onlineUsers[conversation.friend?._id]
                      ? {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          animation: "ripple 1.2s infinite ease-in-out",
                          border: "2px solid #ceed9f",
                        }
                      : {},
                  },
                  "@keyframes ripple": {
                    "0%": {
                      transform: "scale(.8)",
                      opacity: 1,
                    },
                    "100%": {
                      transform: "scale(2.4)",
                      opacity: 0,
                    },
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: stringToColor(conversation.friend?.username),
                    width: 48,
                    height: 48,
                  }}
                >
                  {conversation.friend?.username?.[0]?.toUpperCase() || "?"}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#fff",
                    fontWeight: "500",
                  }}
                >
                  {formatUsername(conversation.friend?.username)}
                </Typography>
              }
              secondary={
                <Typography
                  variant="body2"
                  sx={{
                    color: "#6C7883",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {conversation.lastMessage?.content || "No messages yet"}
                </Typography>
              }
            />
            {conversation.unreadCount?.[user?._id] > 0 && (
              <Box
                sx={{
                  bgcolor: "#2B5278",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ml: 1,
                }}
              >
                <Typography variant="caption">
                  {conversation.unreadCount?.[user?._id]}
                </Typography>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    );
  };

  const renderUserStatus = (userId) => {
    const status = onlineUsers[userId];
    if (!status) return null;

    if (status) {
      return (
        <Typography variant="caption" color="success.main">
          online
        </Typography>
      );
    }

    return (
      <Typography variant="caption" color="text.secondary">
        {formatLastSeen(status.lastActive)}
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        width: 310,
        height: "100vh",
        bgcolor: "#17212B",
        borderRight: "1px solid #2B3945",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #2B3945",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#1E2A36",
        }}
      >
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
          Chats
        </Typography>
        <Box>
          <IconButton
            onClick={() => setAddFriendDialogOpen(true)}
            sx={{
              color: "#E4E6EB",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
              mr: 1,
            }}
          >
            <PersonAddIcon />
          </IconButton>
          <IconButton
            onClick={() => handleLogout()}
            sx={{
              color: "#E4E6EB",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ p: 2, borderBottom: "1px solid #2B3945" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#242F3D",
              borderRadius: 2,
              color: "#fff",
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
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#6C7883" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Conversations List */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#17212B",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#2B5278",
            borderRadius: "3px",
          },
        }}
      >
        {renderConversations()}
      </Box>

      {/* Add Friend Dialog */}
      <Dialog
        open={addFriendDialogOpen}
        onClose={() => setAddFriendDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#17212b",
            color: "#E4E6EB",
          },
        }}
      >
        <DialogTitle>Add Friend</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#6C7883", mb: 2 }}>
            Enter your friend's session ID to start a conversation.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Friend's Session ID"
            fullWidth
            value={friendSessionId}
            onChange={(e) => setFriendSessionId(e.target.value.toUpperCase())}
            error={!!error}
            helperText={error}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#E4E6EB",
                "& fieldset": {
                  borderColor: "#2B5278",
                },
                "&:hover fieldset": {
                  borderColor: "#2B5278",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#2B5278",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#6C7883",
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAddFriendDialogOpen(false)}
            sx={{ color: "#6C7883" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddFriend}
            disabled={addingFriend}
            sx={{
              color: "#E4E6EB",
              "&.Mui-disabled": {
                color: "#6C7883",
              },
            }}
          >
            {addingFriend ? "Adding..." : "Add Friend"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatSidebar;
