import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import ChatMain from "./ChatMain";
import ChatSidebar from "./ChatSidebar";

const ChatContainer = ({ conversations, socket, user }) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackClick = () => {
    setSelectedConversation(null);
  };

  if (isMobile) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100%",
        }}
      >
        {selectedConversation ? (
          // On mobile, if a conversation is selected, show ChatMain with a back button.
          <ChatMain
            conversation={selectedConversation}
            socket={socket}
            user={user}
            onBackClick={handleBackClick}
          />
        ) : (
          // Otherwise, show ChatSidebar.
          <ChatSidebar
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={handleConversationSelect}
          />
        )}
      </Box>
    );
  } else {
    // For larger screens, display both side by side.
    return (
      <Box
        sx={{
          display: "flex",
          height: "100%",
        }}
      >
        <ChatSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
        />
        <ChatMain
          conversation={selectedConversation}
          socket={socket}
          user={user}
        />
      </Box>
    );
  }
};

export default ChatContainer;
