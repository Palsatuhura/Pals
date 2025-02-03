import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { debounce } from 'lodash';
import userService from '../services/userService';
import { showNotification } from '../utils/notificationUtils';

const NewConversationDialog = ({ open, onClose, onCreateConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSearch = debounce(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await userService.searchUsers(query);
      if (response?.data) {
        // Filter out the current user from results
        const currentUserId = localStorage.getItem('userId');
        const filteredResults = response.data.filter(user => user._id !== currentUserId);
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      showNotification('Failed to search users', 'error');
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleCreate = async () => {
    if (!selectedUser) return;

    try {
      await onCreateConversation(selectedUser._id);
      onClose();
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error creating conversation:', error);
      showNotification('Failed to create conversation', 'error');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Conversation</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Search Users"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : searchResults.length > 0 ? (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {searchResults.map((user) => (
              <ListItem
                key={user._id}
                button
                selected={selectedUser?._id === user._id}
                onClick={() => handleUserSelect(user)}
              >
                <ListItemAvatar>
                  <Avatar>{user.username[0].toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.username}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        ) : searchQuery ? (
          <Typography color="text.secondary" align="center">
            No users found
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          disabled={!selectedUser}
          variant="contained"
          color="primary"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewConversationDialog;
