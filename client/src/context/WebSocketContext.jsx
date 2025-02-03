import React, { createContext, useContext, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const socket = useRef(null);

  const connect = () => {
    if (!socket.current) {
      socket.current = io(import.meta.env.VITE_WS_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.current.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      socket.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      socket.current.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    }
  };

  const disconnect = () => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const websocketService = {
    socket: socket.current,
    connect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={{ websocketService }}>
      {children}
    </WebSocketContext.Provider>
  );
};
