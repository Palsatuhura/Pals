import { io } from "socket.io-client";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.messageHandlers = new Set();
    this.typingHandlers = new Set();
    this.messageReadHandlers = new Set();
    this.statusHandlers = new Set();
    this.connectionPromise = null;
    this.lastping = Date.now();
    this.statusInterval = null;
  }

  async updateUserStatus(status) {
    const socket = await this.ensureConnected();
    socket.emit("update_status", { status });
  }

  connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    his.statusInterval = setInterval(() => {
      if (Date.now() - this.lastPing > 30000) {
        // 30 seconds
        this.updateUserStatus("away");
      }
    }, 5000);

    this.socket.on("ping", () => {
      this.lastPing = Date.now();
      this.updateUserStatus("online");
    });

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          reject(new Error("No authentication token found"));
          return;
        }

        this.socket = io("http://localhost:5000", {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on("connect", () => {
          console.log("WebSocket connected");
          resolve(this.socket);
        });

        this.socket.on("connect_error", (error) => {
          console.error("WebSocket connection error:", error);
          this.connectionPromise = null;
          reject(error);
        });

        this.socket.on("disconnect", () => {
          console.log("WebSocket disconnected");
          this.connectionPromise = null;
        });

        // Handle incoming messages
        this.socket.on("new_message", (data) => {
          this.messageHandlers.forEach((handler) => handler(data));
        });

        // Handle typing status
        this.socket.on("user_typing", (data) => {
          this.typingHandlers.forEach((handler) => handler(data));
        });

        // Handle message read status
        this.socket.on("message_read", (data) => {
          this.messageReadHandlers.forEach((handler) => handler(data));
        });

        // Handle user status changes
        this.socket.on("user_status_change", (data) => {
          this.statusHandlers.forEach((handler) => handler(data));
        });
      } catch (error) {
        console.error("WebSocket setup error:", error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  async ensureConnected() {
    if (!this.socket?.connected) {
      await this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
      clearInterval(this.statusInterval);
    }
  }

  // Message handling
  async sendMessage(conversationId, content, replyTo = null) {
    const socket = await this.ensureConnected();
    return new Promise((resolve, reject) => {
      socket.emit("send_message", {
        conversationId,
        content,
        replyTo,
      });
      resolve();
    });
  }

  // Conversation room management
  async joinConversation(conversationId) {
    const socket = await this.ensureConnected();
    return new Promise((resolve) => {
      socket.emit("join_conversation", conversationId);
      resolve();
    });
  }

  async leaveConversation(conversationId) {
    const socket = await this.ensureConnected();
    return new Promise((resolve) => {
      socket.emit("leave_conversation", conversationId);
      resolve();
    });
  }

  // User status handling
  async getUserStatus(userId) {
    const socket = await this.ensureConnected();
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        socket.off("user_status");
        resolve({ status: "offline" });
      }, 5000);

      socket.emit("get_user_status", userId);
      socket.once("user_status", (status) => {
        clearTimeout(timeoutId);
        resolve(status);
      });
    });
  }

  onUserStatusChange(handler) {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  offUserStatusChange(handler) {
    this.statusHandlers.delete(handler);
  }

  // Typing status
  async sendTyping(conversationId, isTyping) {
    const socket = await this.ensureConnected();
    socket.emit("typing", { conversationId, isTyping });
  }

  // Mark message as read
  async markMessageAsRead(conversationId, messageId) {
    const socket = await this.ensureConnected();
    socket.emit("mark_read", { conversationId, messageId });
  }

  // Event listeners
  onNewMessage(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onTyping(handler) {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  onMessageRead(handler) {
    this.messageReadHandlers.add(handler);
    return () => this.messageReadHandlers.delete(handler);
  }

  // Generic event handling
  async emit(event, data) {
    const socket = await this.ensureConnected();
    return new Promise((resolve, reject) => {
      socket.emit(event, data, (response) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async on(event, callback) {
    const socket = await this.ensureConnected();
    socket.on(event, callback);
    return () => socket?.off(event, callback);
  }

  async off(event, callback) {
    const socket = await this.ensureConnected();
    socket.off(event, callback);
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new WebSocketService();
