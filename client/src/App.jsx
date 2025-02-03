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
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import AppRoutes from "./AppRoutes";

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
    // Initialize socket connection
    if (!socket) {
      const token = localStorage.getItem("token");
      const newSocket = io(import.meta.env.VITE_WS_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        auth: {
          token
        },
        extraHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
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
    <Router>
      <NotificationProvider>
        <WebSocketProvider>
          <AuthProvider>
            <ThemeProvider theme={theme}>
              <SocketContext.Provider value={socket}>
                <CssBaseline />
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
                    <AppRoutes
                      isAuthenticated={isAuthenticated}
                      setIsAuthenticated={setIsAuthenticated}
                      showNotification={handleShowNotification}
                    />
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
              </SocketContext.Provider>
            </ThemeProvider>
          </AuthProvider>
        </WebSocketProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
