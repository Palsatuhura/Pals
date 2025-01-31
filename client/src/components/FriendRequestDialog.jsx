import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from "@mui/material";

const FriendRequestDialog = ({ open, onClose, onSendRequest }) => {
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [showFriendRequestDialog, setShowFriendRequestDialog] = useState(false);

  const handleShowFriendRequestDialog = () => {
    setShowFriendRequestDialog(true);
  };

  const handleSubmit = () => {
    if (!sessionId.trim()) {
      setError("Please enter a session ID");
      return;
    }
    onSendRequest(sessionId.trim());
    setSessionId("");
    setError("");
  };

  return (
    <Dialog open={showFriendRequestDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Add Friend</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Enter your friend's session ID
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Friend's Session ID"
          fullWidth
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          error={!!error}
          helperText={error}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Friend
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FriendRequestDialog;
