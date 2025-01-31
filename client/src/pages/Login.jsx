import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  Slide,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Person as PersonIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  Key as KeyIcon,
} from "@mui/icons-material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WarningIcon from "@mui/icons-material/Warning";
import chatService from "../services/chatService";
import { useNavigate } from "react-router-dom";

const Login = ({ setIsAuthenticated, showNotification, websocketService }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showSessionId, setShowSessionId] = useState(false);
  const [newSessionId, setNewSessionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmCopy, setConfirmCopy] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleGetStarted = () => {
    setShowLogin(true);
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignup) {
        // Handle signup
        const response = await chatService.register({ username });
        handleLoginSuccess(response);
      } else {
        // Handle login with session ID
        if (!sessionId) {
          setError("Please enter your session ID");
          showNotification({
            message: "Please enter your session ID",
            severity: "error"
          });
          setLoading(false);
          return;
        }

        const response = await chatService.login({ sessionId: sessionId.toUpperCase() });
        handleLoginSuccess(response);
      }
    } catch (error) {
      console.error("Login/Signup error:", error);
      const errorMessage = error.response?.data?.message || "An error occurred during authentication";
      setError(errorMessage);
      showNotification({
        message: errorMessage,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (response) => {
    if (!response.data || !response.data.user || !response.data.token) {
      throw new Error("Invalid response from server");
    }

    // Store auth data
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userId", response.data.user._id);
    localStorage.setItem("username", response.data.user.username);
    localStorage.setItem("sessionId", response.data.user.sessionId);

    // If this is a new registration, show the session ID
    if (isSignup) {
      setNewSessionId(response.data.user.sessionId);
      setShowSessionId(true);
    } else {
      // Connect to websocket if available
      if (websocketService && typeof websocketService.connect === 'function') {
        websocketService.connect();
      }

      // Set authenticated state
      setIsAuthenticated(true);

      // Show success notification
      showNotification({
        message: `Welcome back, ${response.data.user.username}!`,
        severity: "success"
      });

      // Navigate to main chat
      navigate("/");
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newSessionId);
      setCopied(true);
      showNotification("Session ID copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      showNotification("Failed to copy. Please copy manually.", "error");
    }
  };

  const handleConfirmCopy = () => {
    if (!confirmCopy) {
      showNotification(
        "Please confirm that you have saved your session ID",
        "warning"
      );
      return;
    }
    setShowSessionId(false);
    setConfirmCopy(false);
    setCopied(false);
    setShowLogin(false);
    setIsAuthenticated(true);
    showNotification("Account created successfully! Welcome to Pals");
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8fafc",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        position: "fixed", // Changed from relative
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        m: 0, // Remove margin
        p: 0, // Remove padding
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
              color: "#1e293b",
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
              color: "#64748b",
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
          open={showLogin}
          onClose={() => setShowLogin(false)}
          TransitionComponent={Slide}
          TransitionProps={{ direction: "up" }}
          PaperProps={{
            sx: {
              borderRadius: "20px",
              bgcolor: "#ffffff",
              maxWidth: "95%",
              width: "440px",
              mx: 2,
              backgroundImage:
                "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
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
              sx={{ fontWeight: 700, letterSpacing: "-0.5px" }}
            >
              {isSignup ? "Join Pals" : "Welcome to Pals"}
            </Typography>
            <IconButton
              onClick={() => setShowLogin(false)}
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
                  sx={{
                    mb: 2.5,
                    "& .MuiInputLabel-root": {
                      color: "#64748b",
                      "&.Mui-focused": {
                        color: "#1e293b",
                      },
                      "&.MuiInputLabel-shrink": {
                        transform: "translate(12px, -4px) scale(0.75)",
                      },
                    },
                    "& .MuiFilledInput-root": {
                      backgroundColor: "#f8fafc",
                      borderRadius: 1,
                      border: "1px solid #e2e8f0",
                      "&:hover": {
                        backgroundColor: "#f8fafc",
                        border: "1px solid #94a3b8",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "#f8fafc",
                        border: "1px solid #1e293b",
                      },
                      "&::before, &::after": {
                        display: "none",
                      },
                    },
                  }}
                />
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
                        <KeyIcon sx={{ color: "#64748b" }} />
                      </InputAdornment>
                    ),
                    disableUnderline: true,
                  }}
                  sx={{
                    mb: 1,
                    "& .MuiInputLabel-root": {
                      color: "#64748b",
                      "&.Mui-focused": {
                        color: "#1e293b",
                      },
                      "&.MuiInputLabel-shrink": {
                        transform: "translate(12px, -4px) scale(0.75)",
                      },
                    },
                    "& .MuiFilledInput-root": {
                      backgroundColor: "#f8fafc",
                      borderRadius: 1,
                      border: "1px solid #e2e8f0",
                      "&:hover": {
                        backgroundColor: "#f8fafc",
                        border: "1px solid #94a3b8",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "#f8fafc",
                        border: "1px solid #1e293b",
                      },
                      "&::before, &::after": {
                        display: "none",
                      },
                    },
                  }}
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
          open={showSessionId}
          TransitionComponent={Fade}
          PaperProps={{
            sx: {
              borderRadius: "20px",
              bgcolor: "#ffffff",
              maxWidth: "95%",
              width: "440px",
              mx: 2,
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            },
          }}
        >
          <DialogTitle
            component="div"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: "#1e293b",
              color: "white",
              py: 2.5,
              px: 3,
            }}
          >
            <WarningIcon sx={{ color: "#fbbf24" }} />
            <Typography component="div" variant="h6" sx={{ fontWeight: 600 }}>
              Important: Save Your Session ID
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            <Typography sx={{ mb: 3, color: "#475569", lineHeight: 1.6 }}>
              This is your unique session ID. You'll need it to sign in to your
              account. Please save it in a secure location - you won't be able
              to recover it if lost.
            </Typography>

            <Paper
              sx={{
                p: 3,
                mb: 3,
                bgcolor: "#f8fafc",
                borderRadius: "12px",
                border: "1px dashed #94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "monospace",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  letterSpacing: "0.5px",
                }}
              >
                {newSessionId}
              </Typography>
              <IconButton
                onClick={handleCopy}
                sx={{
                  color: copied ? "#059669" : "#64748b",
                  "&:hover": {
                    bgcolor: "#f1f5f9",
                  },
                }}
              >
                {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
              </IconButton>
            </Paper>

            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmCopy}
                  onChange={(e) => setConfirmCopy(e.target.checked)}
                  sx={{
                    color: "#64748b",
                    "&.Mui-checked": {
                      color: "#1e293b",
                    },
                  }}
                />
              }
              label="I have saved my session ID in a secure location"
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.95rem",
                  color: "#475569",
                },
              }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 4, pb: 4 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleConfirmCopy}
              disabled={!confirmCopy}
              sx={{
                py: 1.5,
                bgcolor: "#1e293b",
                color: "white",
                borderRadius: "12px",
                textTransform: "none",
                fontSize: "1.1rem",
                fontWeight: 600,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                "&:hover": {
                  bgcolor: "#0f172a",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                },
                "&.Mui-disabled": {
                  bgcolor: "#e2e8f0",
                  color: "#94a3b8",
                },
              }}
            >
              Continue to Chat
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Login;
