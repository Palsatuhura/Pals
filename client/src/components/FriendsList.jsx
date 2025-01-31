import { useState, useEffect } from 'react'
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  TextField,
  IconButton,
  Box,
  Typography,
  InputAdornment,
  Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import axios from 'axios'

const FriendsList = ({ selectedFriend, setSelectedFriend }) => {
  const [friends, setFriends] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const sessionId = localStorage.getItem('sessionId')
  const username = localStorage.getItem('username')

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/friends/${sessionId}`)
        setFriends(response.data)
      } catch (error) {
        console.error('Error fetching friends:', error)
      }
    }

    fetchFriends()
  }, [sessionId])

  const filteredFriends = friends.filter((friend) =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User Profile */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: '#1e293b' }}>
          {username?.[0]?.toUpperCase()}
        </Avatar>
        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#f8fafc',
              borderRadius: 3,
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: 'transparent',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'transparent',
              },
            },
          }}
        />
      </Box>

      {/* Navigation Icons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          py: 1,
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <IconButton size="small">
          <HomeIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
        </IconButton>
        <IconButton size="small">
          <MessageIcon sx={{ color: '#1e293b', fontSize: 20 }} />
        </IconButton>
        <IconButton size="small">
          <SettingsIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
        </IconButton>
        <IconButton size="small">
          <LogoutIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Friends List */}
      <List sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
        {filteredFriends.map((friend) => (
          <ListItem
            key={friend.sessionId}
            disablePadding
            sx={{ mb: 0.5 }}
          >
            <ListItemButton
              selected={friend.sessionId === selectedFriend?.sessionId}
              onClick={() => setSelectedFriend(friend)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: '#f1f5f9',
                  '&:hover': {
                    bgcolor: '#f1f5f9',
                  },
                },
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ width: 40, height: 40, bgcolor: '#1e293b' }}>
                  {friend.username[0].toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={friend.username}
                secondary={friend.lastMessage || 'No messages yet'}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: friend.sessionId === selectedFriend?.sessionId ? 600 : 400,
                }}
                secondaryTypographyProps={{
                  color: '#64748b',
                  fontSize: '0.85rem',
                  noWrap: true,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Add Friend Button */}
      <Box sx={{ p: 2 }}>
        <Tooltip title="Add friend">
          <IconButton
            sx={{
              position: 'absolute',
              right: 24,
              bottom: 24,
              bgcolor: '#1e293b',
              color: 'white',
              '&:hover': {
                bgcolor: '#0f172a',
              },
              width: 40,
              height: 40,
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default FriendsList
