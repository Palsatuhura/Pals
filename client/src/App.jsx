import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
//import NavBar from './components/NavBar'
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Snackbar, Alert } from "@mui/material";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#2196f3",
      },
      secondary: {
        main: "#f50057",
      },
    },
  });

  const showNotification = ({ message, severity = "success" }) => {
    if (typeof message !== 'string') {
      console.error('Invalid notification message:', message);
      message = 'An error occurred';
    }
    
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "#f5f7fa",
          }}
        >
          {/*{isAuthenticated && (
            <NavBar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} showNotification={showNotification} />
          )}*/}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              overflow: "hidden",
              "& > .MuiBox-root": {
                mr: "788px",
              },
              mt: isAuthenticated ? "64px" : 0,
              pt: isAuthenticated ? 8 : 0,
            }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  !isAuthenticated ? (
                    <Login
                      setIsAuthenticated={setIsAuthenticated}
                      showNotification={showNotification}
                    />
                  ) : (
                    <Navigate to="/chat" />
                  )
                }
              />
              <Route
                path="/chat"
                element={
                  isAuthenticated ? (
                    <Chat showNotification={showNotification} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/profile"
                element={isAuthenticated ? <Profile /> : <Navigate to="/" />}
              />
              <Route
                path="/help"
                element={
                  isAuthenticated ? (
                    <Help showNotification={showNotification} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
            </Routes>
          </Box>

          {/* Global Notification System */}
          <Snackbar
            open={notification.open}
            autoHideDuration={4000}
            onClose={handleCloseNotification}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            sx={{
              marginTop: "24px",
              "& .MuiPaper-root": {
                minWidth: "300px",
                borderRadius: "8px",
              },
            }}
          >
            <Alert
              onClose={handleCloseNotification}
              severity={notification.severity}
              variant="filled"
              elevation={6}
              sx={{
                width: "100%",
                alignItems: "center",
                "& .MuiAlert-message": {
                  fontSize: "0.95rem",
                },
                "& .MuiAlert-icon": {
                  fontSize: "1.5rem",
                },
              }}
            >
              {notification.message || ""}
            </Alert>
          </Snackbar>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
