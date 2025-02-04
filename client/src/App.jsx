import React, { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router } from "react-router-dom";
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
import { styled } from "@mui/material/styles";

// Page imports
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Help from "./pages/Help";
import Profile from "./pages/Profile";

export const SocketContext = createContext();

const AppContainer = styled(Box)(({ theme }) => ({
  height: "100vh",
  width: "100vw",
  margin: 0,
  padding: 0,
  overflow: "hidden",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.default,
}));

const MainContent = styled(Box)({
  flex: 1,
  overflow: "hidden",
  position: "relative",
  width: "100%",
  height: "100%",
});

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
                <AppContainer>
                  <MainContent>
                    <AppRoutes
                      isAuthenticated={isAuthenticated}
                      setIsAuthenticated={setIsAuthenticated}
                      showNotification={handleShowNotification}
                    />
                  </MainContent>
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
                </AppContainer>
              </SocketContext.Provider>
            </ThemeProvider>
          </AuthProvider>
        </WebSocketProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
