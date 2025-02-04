import React from "react";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { format, isValid } from "date-fns";

const MessageContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isOwn"
})(({ theme, isOwn }) => ({
  display: "flex",
  justifyContent: isOwn ? "flex-end" : "flex-start",
  marginBottom: "2px",
  padding: "0 6%",
  position: "relative",
  zIndex: 1,
}));

const MessageContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isOwn"
})(({ theme, isOwn }) => ({
  maxWidth: "65%",
  minWidth: "100px",
  position: "relative",
  padding: "6px 7px 8px 9px",
  borderRadius: "7.5px",
  backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    [isOwn ? "right" : "left"]: -8,
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderWidth: isOwn ? "0 8px 8px 0" : "0 0 8px 8px",
    borderColor: `transparent ${isOwn ? theme.palette.primary.main : theme.palette.background.paper} transparent transparent`,
    transform: isOwn ? "none" : "scaleX(-1)",
  },
}));

const StyledTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isOwn"
})(({ theme, isOwn }) => ({
  color: isOwn ? "#E9EDEF" : theme.palette.text.primary,
  fontSize: "14.2px",
  lineHeight: "19px",
  wordBreak: "break-word",
}));

const MessageMeta = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  position: "relative",
  float: "right",
  marginLeft: "8px",
  marginBottom: "-5px",
  marginTop: "4px",
});

const TimeTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "isOwn"
})(({ theme, isOwn }) => ({
  fontSize: "11px",
  lineHeight: "15px",
  color: isOwn ? "rgba(233, 237, 239, 0.6)" : theme.palette.text.secondary,
  marginLeft: "4px",
}));

const ReadStatusIcon = ({ isRead }) => (
  <DoneAllIcon 
    sx={{ 
      fontSize: "18px",
      color: isRead ? "#53BDEB" : "rgba(233, 237, 239, 0.6)",
    }} 
  />
);

const formatMessageTime = (timestamp) => {
  try {
    const date = timestamp ? new Date(timestamp) : new Date();
    return isValid(date) ? format(date, "HH:mm") : "Invalid Date";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

const MessageBubble = ({ message, isOwn }) => {
  const formattedTime = formatMessageTime(message?.timestamp || message?.createdAt);

  return (
    <MessageContainer isOwn={isOwn}>
      <MessageContent isOwn={isOwn}>
        <StyledTypography isOwn={isOwn}>{message.content}</StyledTypography>
        <MessageMeta>
          <TimeTypography isOwn={isOwn}>{formattedTime}</TimeTypography>
          {isOwn && <ReadStatusIcon isRead={message.isRead} />}
        </MessageMeta>
      </MessageContent>
    </MessageContainer>
  );
};

export default MessageBubble;
