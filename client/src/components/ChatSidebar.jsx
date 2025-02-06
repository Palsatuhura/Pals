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
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import NewConversationDialog from "./NewConversationDialog";
import { formatDistanceToNow } from "date-fns";
import chatService from "../services/chatService";
import websocketService from "../services/websocketService";
import { formatLastSeen } from "../utils/timeUtils";
import axios from "axios";
import { toast } from "react-toastify";
import { generateAvatarColor } from "../utils/formatUsername";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { showNotification } from "../utils/notificationUtils";

const StyledSidebar = styled(Box)(({ theme }) => ({
  width: "310px",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const Header = styled(Box)(({ theme }) => ({
  padding: "8px 16px",
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: "flex",
  alignItems: "center",
  minHeight: "59px",
  position: "relative",
  zIndex: 1,
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
}));

const UserContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  flex: 1,
});

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.primary.main,
  fontSize: "23px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "transform 0.2s ease",
  "&:hover": {
    transform: "scale(1.05)",
  },
}));

const UserInfo = styled(Box)({
  minWidth: 0,
  marginLeft: "8px",
  cursor: "pointer",
  "&:hover": {
    opacity: 0.8,
  },
});

const HeaderIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  padding: "8px",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main,
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: "8px 16px",
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

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
    console.log("Missing conversation participants or userId:", {
      conversation,
      userId,
    });
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
    console.log("No friend found in conversation:", {
      participants: conversation.participants,
      userId,
    });
  }

  return conversation.participants?.find((p) => p._id !== userId);
};

const ConversationItem = ({
  conversation,
  isSelected,
  onClick,
  onlineUsers,
  userId,
}) => {
  const theme = useTheme();
  const friend = conversation.friend || {};
  const isOnline = onlineUsers[friend._id];

  return (
    <ListItem
      button
      selected={isSelected}
      onClick={onClick}
      sx={{
        px: 2,
        py: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        "&.Mui-selected": {
          backgroundColor: theme.palette.action.selected,
          "&:hover": {
            backgroundColor: theme.palette.action.selected,
          },
        },
      }}
    >
      <ListItemAvatar>
        <StyledAvatar
          src={friend.avatar}
          sx={{
            bgcolor: generateAvatarColor(friend.username || ""),
            width: 48,
            height: 48,
          }}
        >
          {friend.username?.charAt(0).toUpperCase()}
        </StyledAvatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {friend.username}
            </Typography>
            {conversation.lastMessage && (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", ml: 1, flexShrink: 0 }}
              >
                {format(new Date(conversation.lastMessage.createdAt), "h:mm a")}
              </Typography>
            )}
          </Box>
        }
        secondary={
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {isOnline ? (
              <>
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    display: "inline-block",
                  }}
                />
                online
              </>
            ) : (
              conversation.lastMessage?.content || "No messages yet"
            )}
          </Typography>
        }
      />
    </ListItem>
  );
};

const ChatSidebar = ({
  conversations,
  selectedConversation,
  onConversationSelect,
  onlineUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewConversationDialog, setShowNewConversationDialog] =
    useState(false);
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("userId");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      showNotification("Successfully logged out", "success");
    } catch (error) {
      showNotification("Logout failed, please try again", "error");
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleAddFriend = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chatService.createConversation(sessionId);
      setConversations((prev) => [...prev, response.data]);
      setShowAddFriendDialog(false);
      setSessionId("");
      console.log("Response at add friend: ", response);
      toast.success("Friend added successfully!");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add friend");
      toast.error(error.response?.data?.message || "Failed to add friend");
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const friend = conversation.friend || {};
      return (
        friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.lastMessage?.content
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    });
  }, [conversations, searchQuery]);

  const userColor = useMemo(() => {
    return generateAvatarColor(userId || "");
  }, [userId]);

  return (
    <StyledSidebar>
      <Header sx={{ display: "flex", gap: 20 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: "20px",
          }}
        >
          Chat
        </Typography>

        <Typography sx={{ gap: 1, display: "flex" }}>
          <HeaderIconButton
            onClick={() => setShowAddFriendDialog(true)}
            title="Add Friend"
          >
            <PersonAddIcon fontSize="medium" />
          </HeaderIconButton>
          <HeaderIconButton onClick={handleLogout}>
            <LogoutIcon fontSize="medium" />
          </HeaderIconButton>
        </Typography>
      </Header>

      <SearchContainer>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "20px",
            },
          }}
        />
      </SearchContainer>

      <List sx={{ flex: 1, overflow: "auto", p: 0 }}>
        {filteredConversations.map((conversation) => (
          <ConversationItem
            key={conversation._id}
            conversation={conversation}
            isSelected={selectedConversation?._id === conversation._id}
            onClick={() => onConversationSelect(conversation)}
            userId={userId}
            onlineUsers={onlineUsers}
          />
        ))}
      </List>

      <Dialog
        open={showAddFriendDialog}
        onClose={() => setShowAddFriendDialog(false)}
      >
        <DialogTitle>Add New Friend</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the session Id of the friend you want to add.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Session Id"
            fullWidth
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddFriendDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddFriend}
            disabled={!sessionId.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : "Add Friend"}
          </Button>
        </DialogActions>
      </Dialog>

      <NewConversationDialog
        open={showNewConversationDialog}
        onClose={() => setShowNewConversationDialog(false)}
        onNewConversation={onConversationSelect}
      />
    </StyledSidebar>
  );
};

export default ChatSidebar;
