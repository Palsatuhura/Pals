import io from "socket.io-client";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.listeners = new Map();
    this.statusListeners = new Set();
    this.connectionPromise = null;
  }

  async connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const token = localStorage.getItem("token");
      if (!token) {
        const error = new Error("No token found for socket connection");
        console.error(error);
        this.connectionPromise = null;
        reject(error);
        return;
      }

      console.log("Connecting to WebSocket with token");

      this.socket = io("http://localhost:5000", {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on("connect", () => {
        console.log("Socket connected successfully");
        this.connected = true;
        this.authenticated = true;
        resolve(this.socket);
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        this.connected = false;
        this.authenticated = false;
        this.connectionPromise = null;

        if (error.message?.includes("auth")) {
          localStorage.removeItem("token");
          window.location.href = "/";
        }
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        this.connected = false;
        this.authenticated = false;
        this.connectionPromise = null;

        if (reason === "io server disconnect") {
          this.connect();
        }
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
        if (error.message?.includes("auth")) {
          this.authenticated = false;
          this.disconnect();
          localStorage.removeItem("token");
          window.location.href = "/";
        }
        reject(error);
      });
    });

    return this.connectionPromise;
  }

  async disconnect() {
    if (this.socket) {
      console.log("Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.authenticated = false;
      this.connectionPromise = null;
      this.listeners.clear();
      this.statusListeners.clear();
    }
  }

  async getSocket() {
    if (!this.socket || !this.connected) {
      try {
        await this.connect();
      } catch (error) {
        console.error("Failed to connect socket:", error);
        return null;
      }
    }
    return this.socket;
  }

  isConnected() {
    return this.connected && this.authenticated && this.socket?.connected;
  }

  async emit(event, data) {
    const socket = await this.getSocket();
    if (!socket) {
      throw new Error("Socket not connected");
    }
    socket.emit(event, data);
  }

  async on(event, callback) {
    const socket = await this.getSocket();
    if (!socket) {
      throw new Error("Socket not connected");
    }
    socket.on(event, callback);
  }

  async off(event, callback) {
    const socket = await this.getSocket();
    if (!socket) return;
    socket.off(event, callback);
  }

  // User status methods
  async getUserStatus(userId) {
    try {
      return new Promise((resolve, reject) => {
        if (!this.socket) return reject("Socket not connected");

        const timeoutId = setTimeout(() => {
          this.socket.off("user_status", handleStatus);
          this.socket.off("error", handleError);
          resolve({ status: "offline" }); // Default to offline if no response
        }, 5000);

        const handleStatus = (status) => {
          clearTimeout(timeoutId);
          this.socket.off("error", handleError);
          resolve(status);
        };

        const handleError = (error) => {
          clearTimeout(timeoutId);
          this.socket.off("user_status", handleStatus);
          reject(error);
        };

        this.socket.emit("get_user_status", userId);
        this.socket.once("user_status", handleStatus);
        this.socket.once("error", handleError);
      });
    } catch (error) {
      console.error("Error getting user status:", error);
      return { status: "offline" }; // Fallback to offline on error
    }
  }

  // Conversation methods
  async joinConversation(conversationId) {
    try {
      const socket = await this.getSocket();
      if (!socket) {
        throw new Error("Socket not connected");
      }
      socket.emit("join_conversation", conversationId);
    } catch (error) {
      console.error("Error joining conversation:", error);
      throw error;
    }
  }

  async leaveConversation(conversationId) {
    try {
      const socket = await this.getSocket();
      if (!socket) {
        throw new Error("Socket not connected");
      }
      socket.emit("leave_conversation", conversationId);
    } catch (error) {
      console.error("Error leaving conversation:", error);
      throw error;
    }
  }

  async sendMessage({ conversationId, content, tempId }) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject("Socket not connected");

      this.socket.emit("send_message", {
        conversationId,
        content,
        tempId,
      });

      // Wait  for server confirmation
      this.socket.once(`message_ack_${tempId}`, resolve);
      this.socket.once("message_error", reject);
    });
  }

  async subscribeToMessages(callback) {
    try {
      const socket = await this.getSocket();
      if (!socket) {
        throw new Error("Socket not connected");
      }

      // Handle incoming messages
      socket.on("message", (message) => {
        if (message && typeof callback === "function") {
          callback(message);
        }
      });

      // Handle message acknowledgments
      socket.on("messageAck", (ack) => {
        if (ack && typeof callback === "function") {
          callback({
            ...ack.message,
            status: "delivered",
          });
        }
      });

      return () => {
        socket.off("message");
        socket.off("messageAck");
      };
    } catch (error) {
      console.error("Error subscribing to messages:", error);
      throw error;
    }
  }

  async setTyping(conversationId, isTyping) {
    try {
      const socket = await this.getSocket();
      if (!socket) {
        throw new Error("Socket not connected");
      }
      socket.emit("typing", { conversationId, isTyping });
    } catch (error) {
      console.error("Error setting typing status:", error);
      throw error;
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
