import React from "react";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { format } from "date-fns";
import DoneAllIcon from "@mui/icons-material/DoneAll";

const MessageContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isOwn"
})(({ theme, isOwn }) => ({
  display: "flex",
  justifyContent: isOwn ? "flex-end" : "flex-start",
  marginBottom: "8px",
  padding: "0 16px",
  position: "relative",
}));

const MessageContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isOwn"
})(({ theme, isOwn }) => ({
  maxWidth: "65%",
  minWidth: "100px",
  padding: "6px 7px 8px 9px",
  borderRadius: "7.5px",
  position: "relative",
  backgroundColor: isOwn
    ? theme.palette.primary.main
    : theme.palette.background.paper,
  color: isOwn
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    [isOwn ? "right" : "left"]: -8,
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderWidth: isOwn ? "0 8px 8px 0" : "0 0 8px 8px",
    borderColor: isOwn
      ? `transparent ${theme.palette.primary.main} transparent transparent`
      : `transparent transparent transparent ${theme.palette.background.paper}`,
  },
}));

const MessageText = styled(Typography)({
  fontSize: "14.2px",
  lineHeight: "19px",
  wordBreak: "break-word",
  whiteSpace: "pre-wrap",
  textAlign: "left",
});

const StyledTimeStamp = styled('div')(({ theme, isOwn }) => ({
  fontSize: "11px",
  lineHeight: "15px",
  marginLeft: "4px",
  float: "right",
  marginTop: "4px",
  color: isOwn ? "rgba(255, 255, 255, 0.6)" : theme.palette.text.secondary,
  display: "flex",
  alignItems: "center",
  gap: "4px",
}));

const MessageBubble = ({ message, isOwn }) => {
  const formatMessageTime = (timestamp) => {
    try {
      return format(new Date(timestamp), "HH:mm");
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  return (
    <MessageContainer isOwn={isOwn}>
      <MessageContent isOwn={isOwn}>
        <MessageText>{message.content}</MessageText>
        <StyledTimeStamp isOwn={isOwn}>
          {formatMessageTime(message.createdAt)}
          {isOwn && (
            <DoneAllIcon
              sx={{
                fontSize: 14,
                color: message.isRead ? "#53bdeb" : "inherit",
              }}
            />
          )}
        </StyledTimeStamp>
      </MessageContent>
    </MessageContainer>
  );
};

export default React.memo(MessageBubble);
