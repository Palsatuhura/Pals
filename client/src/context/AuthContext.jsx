import React, { createContext, useContext, useState } from "react";
import chatService from "../services/chatService";
import websocketService from "../services/websocketService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await chatService.logout();

      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");

      if (websocketService) {
        websocketService.disconnect();
      }

      return true;
    } catch (error) {
      console.error("Logout Failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
