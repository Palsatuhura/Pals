import { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Avatar,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
} from '@mui/material'
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material'
import chatService from '../services/chatService'

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    status: '',
    profilePicture: '',
  })
  const sessionId = localStorage.getItem('sessionId')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await chatService.getProfile(sessionId)
        setProfile(response.data)
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfile()
  }, [sessionId])

  const handleProfileUpdate = async () => {
    try {
      const response = await chatService.updateProfile(profile)
      setProfile(response.data)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const response = await chatService.updateProfilePicture(sessionId, file)
      setProfile({ ...profile, profilePicture: response.data.profilePicture })
    } catch (error) {
      console.error('Error uploading profile picture:', error)
    }
  }

  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 4, p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profile.profilePicture}
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            <input
              accept="image/*"
              type="file"
              id="profile-picture-input"
              onChange={handleProfilePictureUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="profile-picture-input">
              <IconButton
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                }}
              >
                <PhotoCameraIcon />
              </IconButton>
            </label>
          </Box>

          <TextField
            fullWidth
            label="Name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />

          <TextField
            fullWidth
            label="Status"
            value={profile.status}
            onChange={(e) => setProfile({ ...profile, status: e.target.value })}
            margin="normal"
          />

          <Button
            variant="contained"
            onClick={handleProfileUpdate}
            sx={{ mt: 3 }}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}

export default Profile
