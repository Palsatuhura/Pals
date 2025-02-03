import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

const NavBar = ({ isAuthenticated, setIsAuthenticated, showNotification }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    showNotification({ message: 'Logged out successfully', severity: 'success' });
    navigate('/');
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Pals Chat
        </Typography>

        {isAuthenticated && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => navigate('/chat')}
              title="Chat"
            >
              <ChatIcon />
            </IconButton>

            <IconButton
              color="inherit"
              onClick={() => navigate('/help')}
              title="Help"
            >
              <HelpIcon />
            </IconButton>

            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
