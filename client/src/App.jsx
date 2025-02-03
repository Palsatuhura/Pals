import React, { useState, useEffect, createContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { showNotification } from "./utils/notificationUtils";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import "./App.css";
import { CssBaseline } from "@mui/material";
import { io } from "socket.io-client";

// Page imports
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Help from "./pages/Help";
import Profile from "./pages/Profile";

export const SocketContext = createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [darkMode, setDarkMode] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      extraHeaders: {
        'Access-Control-Allow-Origin': '*'
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      const userId = localStorage.getItem('userId');
      if (userId) {
        newSocket.emit('login', userId);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleShowNotification = ({ message, severity = "success" }) => {
    if (!message) {
      console.error("Invalid notification message:", message);
      return;
    }
    showNotification(message, severity);
  };

  return (
    <ThemeProvider theme={theme}>
      <SocketContext.Provider value={socket}>
        <CssBaseline />
        <Router>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              bgcolor: "background.default",
              color: "text.primary",
            }}
          >
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    !isAuthenticated ? (
                      <Login
                        setIsAuthenticated={setIsAuthenticated}
                        showNotification={handleShowNotification}
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
                      <Chat showNotification={handleShowNotification} />
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
                      <Help showNotification={handleShowNotification} />
                    ) : (
                      <Navigate to="/" />
                    )
                  }
                />
              </Routes>
            </Box>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </Box>
        </Router>
      </SocketContext.Provider>
    </ThemeProvider>
  );
}

export default App;
