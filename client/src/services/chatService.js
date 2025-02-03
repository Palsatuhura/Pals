import axios from "axios";
import mongoose from "mongoose";

const API_URL = "http://localhost:5000/api";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login on auth error
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Chat services
const chatService = {
  // Login with session ID
  login: async ({ sessionId }) => {
    try {
      const response = await api.post("/auth/login", { sessionId });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.user._id);
        localStorage.setItem("sessionId", response.data.user.sessionId);
      }
      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Register new user
  register: async ({ username }) => {
    try {
      const response = await api.post("/auth/register", { username });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.user._id);
        localStorage.setItem("sessionId", response.data.user.sessionId);
      }
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post("/users/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("sessionId");
      return response.data;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  // Get all messages for a conversation
  getMessages: async (conversationId) => {
    try {
      const response = await api.get(`/messages/${conversationId}`);
      return {
        data: response.data.messages || [],
        status: response.status
      };
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  },

  // Send a new message
  sendMessage: async (conversationId, content) => {
    try {
      const response = await api.post(`/messages/${conversationId}`, { content });
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Get user conversations
  getConversations: async () => {
    try {
      const response = await api.get("/conversations");
      return response;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  },

  // Create new conversation
  createConversation: async (sessionId) => {
    try {
      const response = await api.post("/conversations", { sessionId });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update message status
  updateMessageStatus: async (messageId, status) => {
    try {
      const response = await api.put(`/messages/${messageId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get online status of users
  getUserStatus: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get online status of multiple users
  getUserStatuses: async (userIds) => {
    try {
      // Filter out invalid IDs first
      const validUserIds = userIds.filter(
        (id) => id && id.match(/^[0-9a-fA-F]{24}$/)
      );

      if (validUserIds.length === 0) return {};

      // Use Promise.all to fetch status for each user
      const statusPromises = validUserIds.map((userId) =>
        api
          .get(`/users/${userId}/status`)
          .then((response) => ({ [userId]: response.data }))
          .catch((error) => {
            console.log(`Failed to get status for user ${userId}:`, error);
            return { [userId]: { status: "offline", lastSeen: null } };
          })
      );

      const statuses = await Promise.all(statusPromises);
      // Combine all status objects into one
      return statuses.reduce((acc, status) => ({ ...acc, ...status }), {});
    } catch (error) {
      console.error("Error fetching user statuses:", error);
      return {}; // Return empty object instead of throwing
    }
  },

  // Set user typing status
  setTypingStatus: async (conversationId, isTyping) => {
    try {
      const response = await api.post(
        `/conversations/${conversationId}/typing`,
        { isTyping }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all users
  getUsers: async () => {
    try {
      const response = await api.get("/users");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add friend by session ID
  addFriend: async (sessionId) => {
    try {
      const response = await api.post("/users/add-friend", { sessionId });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error("User not found with this session ID");
      }
      throw error;
    }
  },

  // Mark conversation as read
  markConversationAsRead: async (conversationId) => {
    try {
      const response = await api.put(`/conversations/${conversationId}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add reaction to message
  addReaction: async (messageId, reaction) => {
    try {
      const response = await api.post(`/messages/${messageId}/reactions`, {
        reaction,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Remove reaction from message
  removeReaction: async (messageId, reactionId) => {
    try {
      const response = await api.delete(
        `/messages/${messageId}/reactions/${reactionId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload file
  uploadFile: async (conversationId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        `/messages/${conversationId}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user by session ID
  getUserBySessionId: async (sessionId) => {
    try {
      const response = await api.get(`/users/session/${sessionId}`); // Adjust the endpoint as needed
      return response.data;
    } catch (error) {
      throw error; // Handle error appropriately
    }
  },

  //get conversation details

  getConversationDetails: async (conversationId) => {
    try {
      const response = await api.get(`/conversations/${conversationId}`);
      console.log(
        "Conversation details at get conversation details in chat service:",
        response.data
      );
      return {
        data: {
          ...response.data,
          unreadCount: response.data.unreadCount || 0,
        },
      };
    } catch (error) {
      console.error("Get conversation details error:", error);
      throw error;
    }
  },

  // Get conversations
  getConversationsList: async () => {
    try {
      const response = await api.get("/conversations");
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  },

  // Get user statuses
  getUserStatusesList: async (userIds) => {
    try {
      const response = await api.post("/users/status", { userIds });
      return response.data;
    } catch (error) {
      console.error("Error fetching user statuses:", error);
      throw error;
    }
  },

  // Mark conversation as read
  markConversationAsReadList: async (conversationId) => {
    try {
      const response = await api.post(`/conversations/${conversationId}/read`);
      return response.data;
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      throw error;
    }
  },

  // Create new conversation
  createConversationList: async (userId) => {
    try {
      const response = await api.post("/conversations", { userId });
      return response.data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get("/users/profile");
      return response.data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/users/profile", profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  // Update profile picture
  updateProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await api.post("/users/profile/picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw error;
    }
  },
};

export default chatService;
