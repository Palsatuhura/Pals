import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Help from './pages/Help';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Login />
          ) : (
            <Navigate to="/chat" />
          )
        }
      />

      <Route
        path="/chat"
        element={
          isAuthenticated ? (
            <Chat />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/profile"
        element={
          isAuthenticated ? (
            <Profile />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/help"
        element={
          isAuthenticated ? (
            <Help />
          ) : (
            <Navigate to="/" />
          )
        }
      />
    </Routes>
  );
};

export default AppRoutes;
