import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';

const MessageContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  display: 'flex',
  justifyContent: isOwn ? 'flex-end' : 'flex-start',
  marginBottom: theme.spacing(1),
}));

const MessageContent = styled(Box, {
  shouldForwardProp: prop => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  maxWidth: '70%',
  padding: '12px 16px',
  borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
  backgroundColor: isOwn ? '#2B5278' : '#1E2C3A',
  color: '#fff',
  position: 'relative',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    [isOwn ? 'right' : 'left']: -8,
    width: 8,
    height: 8,
    background: isOwn ? '#2B5278' : '#1E2C3A',
    clipPath: isOwn 
      ? 'polygon(0 0, 100% 0, 100% 100%)'
      : 'polygon(0 0, 100% 0, 0 100%)',
  }
}));

const formatMessageTime = (date) => {
  return format(new Date(date), 'h:mm aaa').toLowerCase();
};

const MessageBubble = ({ message, isOwn }) => {
  return (
    <MessageContainer isOwn={isOwn}>
      <MessageContent isOwn={isOwn}>
        <Typography 
          variant="body1" 
          sx={{ 
            wordBreak: 'break-word',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            letterSpacing: '0.01em',
          }}
        >
          {message.content}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'right',
            fontSize: '0.75rem',
            userSelect: 'none',
          }}
        >
          {formatMessageTime(message.createdAt)}
        </Typography>
      </MessageContent>
    </MessageContainer>
  );
};

export default MessageBubble;
