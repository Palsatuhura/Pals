import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import chatService from '../services/chatService';

const SearchInput = styled(TextField)({
  marginBottom: '20px',
  '& .MuiInputBase-input': {
    color: '#fff',
  },
  '& .MuiInputLabel-root': {
    color: '#8596a7',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#242f3d',
    },
    '&:hover fieldset': {
      borderColor: '#2b5278',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2b5278',
    },
  },
});

const StyledListItem = styled(ListItem)(({ selected }) => ({
  cursor: 'pointer',
  backgroundColor: selected ? '#2b5278' : 'transparent',
  '&:hover': {
    backgroundColor: selected ? '#2b5278' : '#1c2733',
  },
}));

const NewConversationDialog = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await chatService.getUsers();
      // Filter out the current user
      const currentUserId = localStorage.getItem('userId');
      setUsers(response.filter(user => user.id !== currentUserId));
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const userIds = selectedUsers.map(user => user.id);
      await chatService.createConversation(userIds);
      onClose();
      setSelectedUsers([]);
      setSearchQuery('');
    } catch (err) {
      setError('Failed to create conversation');
      console.error('Error creating conversation:', err);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: '#17212b',
          color: '#fff',
          minWidth: '400px',
        }
      }}
    >
      <DialogTitle>New Conversation</DialogTitle>
      <DialogContent>
        <SearchInput
          autoFocus
          margin="dense"
          label="Search users"
          type="text"
          fullWidth
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress />
          </div>
        ) : (
          <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {filteredUsers.map((user) => (
              <StyledListItem
                key={user.id}
                selected={selectedUsers.some(u => u.id === user.id)}
                onClick={() => handleUserSelect(user)}
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar} alt={user.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{ color: '#fff' }}>
                      {user.name}
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{ color: '#8596a7' }}>
                      {user.email}
                    </Typography>
                  }
                />
              </StyledListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: '16px' }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#8596a7',
            '&:hover': {
              backgroundColor: '#1c2733',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateConversation}
          disabled={selectedUsers.length === 0}
          sx={{
            backgroundColor: '#2b5278',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#1c2733',
            },
            '&.Mui-disabled': {
              backgroundColor: '#1c2733',
              color: '#8596a7',
            }
          }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewConversationDialog;
