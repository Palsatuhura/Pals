import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Slide,
} from "@mui/material";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  ContentCopy as ContentCopyIcon,
  Login as LoginIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import chatService from "../services/chatService";
import { useAuth } from "../context/AuthContext";
import { showNotification } from "../utils/notificationUtils";
import { useWebSocket } from "../context/WebSocketContext";

const Login = () => {
  const navigate = useNavigate();

  const { websocketService } = useWebSocket();
  const { setIsAuthenticated } = useAuth();

  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false); // Default to login view
  const [showSessionIdDialog, setShowSessionIdDialog] = useState(false);
  const [showSessionIdInput, setShowSessionIdInput] = useState(false); // Show session ID input by default
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [newSessionId, setNewSessionId] = useState("");
  const [copied, setCopied] = useState(false);

  const generateSessionId = (username) => {
    const prefix = username.substring(0, 2).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = new Date().toLocaleString("default", { month: "long" });
    const suffix = `${year}${month[0].toUpperCase()}`;
    return `${prefix}-${randomPart}-${suffix}`;
  };

  const formatSessionId = (input) => {
    // Remove any non-alphanumeric characters
    const cleaned = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    // Format as XX-XXXX-YYYYM
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    } else if (cleaned.length <= 11) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(
        6
      )}`;
    } else {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(
        6,
        11
      )}`;
    }
  };

  const validateUsername = (value) => {
    const regex = /^[A-Za-z]{3,}$/;
    return regex.test(value);
  };

  const validateSessionId = (value) => {
    const regex = /^[A-Z]{2}-[A-Z0-9]{4}-[A-Z0-9]{5}$/;
    return regex.test(value);
  };

  const handleGetStarted = () => {
    setShowSessionIdInput(true);
    setIsSignup(false); // Show login view first
  };

  const handleUsernameChange = (e) => {
    // Capitalize and remove numbers/symbols
    const formatted = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
    setUsername(formatted);
    if (formatted && !validateUsername(formatted)) {
      setError("Username must be at least 3 letters, no numbers or symbols");
    } else {
      setError("");
    }
  };

  const handleSessionIdChange = (e) => {
    const formatted = formatSessionId(e.target.value);
    setSessionId(formatted);
    if (formatted && !validateSessionId(formatted)) {
      setError("Invalid session ID");
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        // Handle signup
        if (!username) {
          setError("Please enter a username");
          showNotification("Please enter a Username", "error");
          setLoading(false);
          return;
        }

        const response = await chatService.register({ username });
        handleLoginSuccess(response);
      } else {
        // Handle login with session ID
        if (!sessionId) {
          setError("Please enter your session ID");
          showNotification("Please enter a Session ID", "error");
          setLoading(false);
          return;
        }

        const response = await chatService.login({
          sessionId: sessionId.toUpperCase(),
        });

        handleLoginSuccess(response);
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError(error.message);
      showNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (response) => {
    console.log("Login response:", response.data);

    // Store auth data
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    // If this is a new registration, show the session ID
    if (isSignup) {
      setNewSessionId(response.data.user.sessionId);
      setShowSessionIdDialog(true);
    } else {
      // Connect to websocket if available
      if (websocketService && typeof websocketService.connect === "function") {
        websocketService.connect();
      }

      setIsAuthenticated(true);
      // Show success notification
      showNotification(
        `Welcome back, ${response.data.user.username}!`,
        "success"
      );

      // Navigate to chat
      navigate("/chat");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newSessionId);
      showNotification(`✅ Copied`, "success");
      setCopied(true);
      setShowConfirmDialog(true);
    } catch (error) {
      showNotification("Failed to copy", "error");
    }
  };

  const handleConfirmCopy = () => {
    // Connect websocket
    if (websocketService && typeof websocketService.connect === "function") {
      websocketService.connect();
    }

    setIsAuthenticated(true);
    setShowSessionIdDialog(false);
    setShowConfirmDialog(false);

    // Show success notification
    showNotification(`Registration successful! Welcome to Pals`, "success");

    // Navigate to chat
    navigate("/chat", { replace: true });
  };

  const inputSx = {
    "& .MuiFilledInput-root": {
      backgroundColor: "#1E2C3A",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.23)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.4)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#2B5278",
      },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(255, 255, 255, 0.7)",
      "&.Mui-focused": {
        color: "#2B5278",
      },
    },
    "& .MuiInputBase-input": {
      color: "#fff",
    },
    "& .MuiInputAdornment-root": {
      color: "rgba(255, 255, 255, 0.7)",
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#0F1620",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: "absolute",
          width: "200%", // Extend for full width
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.4,
          background: `radial-gradient(circle at 25px 25px, #e2e8f0 2%, transparent 0%), 
                  radial-gradient(circle at 75px 75px, #e2e8f0 2%, transparent 0%)`,
          backgroundSize: "100px 100px",
          zIndex: 1,
        }}
      />

      {/* Content Container */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        {/* Logo and Brand */}
        <Box sx={{ mb: 6, textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "Secondary",
              textAlign: "center",
              mb: 2,
              letterSpacing: "-1px",
            }}
          >
            Pals
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              textAlign: "center",
              mb: 6,
              maxWidth: "600px",
              mx: "auto",
            }}
          >
            Connect with friends and make new ones in a safe and friendly
            environment
          </Typography>
        </Box>

        {/* Get Started Button */}
        <Button
          variant="contained"
          onClick={handleGetStarted}
          sx={{
            bgcolor: "#1e293b",
            color: "white",
            px: 6,
            py: 1.8,
            borderRadius: "12px",
            fontSize: "1.1rem",
            textTransform: "none",
            fontWeight: 600,
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            "&:hover": {
              bgcolor: "#0f172a",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              transform: "translateY(-2px)",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          Get Started
        </Button>

        {/* Login/Signup Dialog */}
        <Dialog
          open={showSessionIdInput}
          onClose={() => setShowSessionIdInput(false)}
          TransitionComponent={Slide}
          TransitionProps={{ direction: "up" }}
          PaperProps={{
            sx: {
              borderRadius: "20px",
              bgcolor: "#17212B",
              maxWidth: "95%",
              width: "440px",
              mx: 2,
              backgroundImage:
                "linear-gradient(135deg, #17212B 0%, #1E2C3A 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            component="div"
            sx={{
              textAlign: "center",
              pt: 4,
              pb: 2,
              px: 4,
              color: "#1e293b",
              position: "relative",
            }}
          >
            <Typography
              component="div"
              variant="h5"
              sx={{ fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" }}
            >
              {isSignup ? "Join Pals" : "Welcome to Pals"}
            </Typography>
            <IconButton
              onClick={() => setShowSessionIdInput(false)}
              sx={{
                position: "absolute",
                right: 16,
                top: 16,
                color: "#94a3b8",
                "&:hover": {
                  bgcolor: "#f1f5f9",
                  color: "#64748b",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ px: 4, pb: 4, pt: 2 }}>
            <Box component="form" onSubmit={handleSubmit}>
              {isSignup ? (
                <Box>
                  <TextField
                    fullWidth
                    label="Username"
                    variant="filled"
                    value={username}
                    onChange={handleUsernameChange}
                    error={!!error && error.includes("Username")}
                    helperText={
                      error && error.includes("Username")
                        ? error
                        : "Minimum 3 letters, no numbers or symbols"
                    }
                    disabled={!isSignup}
                    inputProps={{
                      maxLength: 20,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: "#64748b" }} />
                        </InputAdornment>
                      ),
                      disableUnderline: true,
                    }}
                    sx={inputSx}
                  />
                </Box>
              ) : (
                <TextField
                  fullWidth
                  label="Session ID"
                  variant="filled"
                  value={sessionId}
                  onChange={handleSessionIdChange}
                  error={!!error && error.includes("Session ID")}
                  helperText={
                    error && error.includes("Session ID")
                      ? error
                      : "Format: XX-XXXX-XXXXX"
                  }
                  disabled={isSignup}
                  inputProps={{
                    maxLength: 13, // Max length of XX-XXXX-YYYYM
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LoginIcon sx={{ color: "#64748b" }} />
                      </InputAdornment>
                    ),
                    disableUnderline: true,
                  }}
                  sx={inputSx}
                />
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  mb: 3,
                  py: 1.8,
                  borderRadius: "12px",
                  bgcolor: "#1e293b",
                  color: "white",
                  textTransform: "none",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  "&:hover": {
                    bgcolor: "#0f172a",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {isSignup ? "Create Account" : "Sign In"}
              </Button>

              <Button
                fullWidth
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                  setUsername("");
                  setSessionId("");
                }}
                sx={{
                  textTransform: "none",
                  color: "#64748b",
                  fontSize: "0.95rem",
                  "&:hover": {
                    bgcolor: "#f8fafc",
                    color: "#1e293b",
                  },
                }}
              >
                {isSignup
                  ? "Already have a session ID? Sign In"
                  : "New user? Create Account"}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Session ID Dialog */}
        <Dialog
          open={showSessionIdDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "20px",
              bgcolor: "#17212B",
              maxWidth: "95%",
              width: "440px",
              mx: 2,
              background: "linear-gradient(135deg, #17212B 0%, #1E2C3A 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              textAlign: "center",
              color: "#fff",
              fontSize: "1.5rem",
              fontWeight: 600,
              pt: 4,
            }}
          >
            Important: Save Your Session ID
          </DialogTitle>
          <DialogContent sx={{ px: 4, pb: 4 }}>
            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: "rgba(255, 255, 255, 0.7)",
                textAlign: "center",
              }}
            >
              Please save this session ID. You'll need it to log in to your
              account.
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 3,
                p: 2,
                borderRadius: 1,
                bgcolor: "#1E2C3A",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  flex: 1,
                  textAlign: "center",
                  fontFamily: "monospace",
                  color: "#fff",
                  userSelect: "all",
                }}
              >
                {newSessionId}
              </Typography>
              <IconButton
                onClick={handleCopy}
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    color: "#fff",
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Box>
            <Typography
              variant="body2"
              color="error"
              sx={{ mb: 2, textAlign: "center" }}
            >
              Warning: This ID will not be shown again!
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              px: 4,
              pb: 4,
              justifyContent: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={handleConfirmCopy}
              sx={{
                bgcolor: "#2B5278",
                color: "#fff",
                px: 4,
                "&:hover": {
                  bgcolor: "#1E3A5F",
                },
              }}
            >
              I've Saved My Session ID
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog
          open={showConfirmDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "20px",
              bgcolor: "#17212B",
              maxWidth: "95%",
              width: "440px",
              mx: 2,
              background: "linear-gradient(135deg, #17212B 0%, #1E2C3A 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              textAlign: "center",
              color: "#fff",
              fontSize: "1.5rem",
              fontWeight: 600,
              pt: 4,
            }}
          >
            Confirm
          </DialogTitle>
          <DialogContent sx={{ px: 4, pb: 4 }}>
            <Typography
              variant="body1"
              sx={{
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              Have you saved your session ID? You won't be able to access your
              account without it.
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              px: 4,
              pb: 4,
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Button
              onClick={() => setShowConfirmDialog(false)}
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              No, Go Back
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmCopy}
              sx={{
                bgcolor: "#2B5278",
                color: "#fff",
                "&:hover": {
                  bgcolor: "#1E3A5F",
                },
              }}
            >
              Yes, I've Saved It
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Login;
