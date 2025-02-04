import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  memo,
  useCallback,
} from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { showNotification } from "../utils/notificationUtils";
import chatService from "../services/chatService";
import { SocketContext } from "../App";
import MessageBubble from "./MessageBubble";
import { styled } from "@mui/material/styles";
import { format } from "date-fns";
import { formatUsername, generateAvatarColor } from "../utils/formatUsername";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { formatDistanceToNow } from "date-fns";

const MemoizedMessageBubble = memo(MessageBubble);

const ChatMainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  position: "relative",
  backgroundColor: theme.palette.background.default,
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

const HeaderIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  padding: "8px",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main,
  },
}));

const AvatarContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  flex: 1,
});

const UserInfo = styled(Box)({
  minWidth: 0,
  cursor: "pointer",
  marginLeft: "8px",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.8,
  },
});

const UserName = styled(Typography)({
  fontWeight: 600,
  fontSize: "16px",
  lineHeight: "21px",
  display: "-webkit-box",
  "-webkit-line-clamp": 1,
  "-webkit-box-orient": "vertical",
  overflow: "hidden",
});

const UserStatus = styled(Typography)(({ theme, isOnline }) => ({
  fontSize: "13px",
  lineHeight: "18px",
  color: isOnline ? theme.palette.success.main : theme.palette.text.secondary,
  display: "flex",
  alignItems: "center",
  gap: "4px",
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.primary.main,
  fontSize: "16px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "transform 0.2s ease",
  "&:hover": {
    transform: "scale(1.05)",
  },
}));

const OnlineBadge = styled("span")(({ theme }) => ({
  display: "inline-block",
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  backgroundColor: theme.palette.success.main,
  marginRight: "4px",
  boxShadow: "0 0 0 2px " + theme.palette.background.paper,
}));

const HeaderActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "4px",
  alignItems: "center",
  marginLeft: "auto",
}));

const MessagesContainer = styled(Box)({
  flex: 1,
  overflowY: "auto",
  padding: "20px 0",
  display: "flex",
  flexDirection: "column",
});

const InputContainer = styled(Box)(({ theme }) => ({
  padding: "10px",
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const ChatMain = ({
  conversation,
  socket,
  onlineUsers,
  isConnected,
  user,
  onBackClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Reset state when conversation changes
  useEffect(() => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setNewMessage("");
  }, [conversation?._id]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversation?._id) return;

      setLoading(true);
      try {
        const response = await chatService.getMessages(conversation._id);

        if (Array.isArray(response?.data)) {
          const processedMessages = response.data.map((msg) => {
            let senderId = msg.sender;
            if (typeof msg.sender === "object") {
              senderId = msg.sender._id || msg.sender.id || msg.sender;
            }
            return {
              ...msg,
              sender: senderId,
            };
          });
          setMessages(processedMessages);
        }
        scrollToBottom();
      } catch (error) {
        console.error("Error loading messages:", error);
        showNotification(`Failed to load messages`, "error");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversation?._id, user]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !conversation?._id) return;

    const messageData = {
      conversationId: conversation._id,
      content: newMessage.trim(),
      sender: user._id, // Ensure we're sending the ID, not the whole user object
    };

    try {
      socket.emit("send_message", messageData);
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      showNotification(`Failed to send message`, "error");
    }
  };

  // Listen for new messages
  useEffect(() => {
    if (!socket || !conversation?._id) return;

    const handleNewMessage = (message) => {
      if (message.conversationId === conversation._id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, conversation?._id, scrollToBottom]);

  if (!conversation) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.secondary,
        }}
      >
        <Typography variant="h6">
          Select a conversation to start chatting
        </Typography>
      </Box>
    );
  }

  return (
    <ChatMainContainer>
      <Header>
        {onBackClick && (
          <HeaderIconButton onClick={onBackClick} edge="start">
            <ArrowBackIcon />
          </HeaderIconButton>
        )}
        <AvatarContainer>
          <StyledAvatar
            src={conversation?.friend?.avatar}
            alt={conversation?.friend?.username}
          >
            {conversation?.friend?.username?.charAt(0).toUpperCase()}
          </StyledAvatar>
          <UserInfo>
            <UserName variant="subtitle1">
              {conversation?.friend?.username || "Chat"}
            </UserName>
            <UserStatus
              variant="body2"
              isOnline={onlineUsers[conversation?.friend?._id]}
            >
              {onlineUsers[conversation?.friend?._id] ? (
                <>
                  <OnlineBadge />
                  online
                </>
              ) : (
                `last seen ${format(
                  new Date(conversation?.friend?.lastSeen || new Date()),
                  "h:mm a"
                ).toLowerCase()}`
              )}
            </UserStatus>
          </UserInfo>
        </AvatarContainer>
        <HeaderActions>
          <HeaderIconButton size="small" title="Search in conversation">
            <SearchIcon fontSize="small" />
          </HeaderIconButton>
          <HeaderIconButton size="small" title="More options">
            <MoreVertIcon fontSize="small" />
          </HeaderIconButton>
        </HeaderActions>
      </Header>

      <MessagesContainer ref={messagesContainerRef}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          messages.map((message, index) => {
            const isOwn = String(message.sender) === String(user._id);
            return (
              <MemoizedMessageBubble
                key={message._id || index}
                message={{
                  ...message,
                  sender: message.sender,
                }}
                isOwn={isOwn}
              />
            );
          })
        )}
      </MessagesContainer>

      <InputContainer>
        <form onSubmit={handleSendMessage}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!isConnected}
              multiline
              maxRows={4}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "20px",
                },
              }}
            />
            <IconButton
              type="submit"
              color="primary"
              disabled={!newMessage.trim() || !isConnected}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </form>
      </InputContainer>
    </ChatMainContainer>
  );
};

export default ChatMain;
