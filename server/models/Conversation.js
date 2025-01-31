const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    pinnedMessages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    }],
    settings: {
      type: Map,
      of: {
        muted: {
          type: Boolean,
          default: false,
        },
        theme: {
          type: String,
          enum: ["default", "light", "dark"],
          default: "default",
        },
        notifications: {
          type: Boolean,
          default: true,
        },
      },
      default: new Map(),
    },
    archived: {
      type: Map,
      of: {
        type: Boolean,
        default: false,
      },
      default: new Map(),
    },
    typing: {
      type: Map,
      of: Date,
      default: new Map(),
    },
    mediaGallery: {
      images: [{
        messageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Message",
        },
        url: String,
        thumbnail: String,
        createdAt: Date,
      }],
      files: [{
        messageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Message",
        },
        filename: String,
        url: String,
        size: Number,
        type: String,
        createdAt: Date,
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessage: 1 });
conversationSchema.index({ "mediaGallery.images.messageId": 1 });
conversationSchema.index({ "mediaGallery.files.messageId": 1 });

// Methods to manage conversation settings
conversationSchema.methods.getUserSettings = function(userId) {
  const userSettings = this.settings.get(userId.toString());
  return userSettings || {
    muted: false,
    theme: "default",
    notifications: true,
  };
};

conversationSchema.methods.updateUserSettings = function(userId, settings) {
  this.settings.set(userId.toString(), {
    ...this.getUserSettings(userId),
    ...settings,
  });
  return this.save();
};

// Methods to manage typing status
conversationSchema.methods.setTyping = function(userId) {
  this.typing.set(userId.toString(), new Date());
  return this.save();
};

conversationSchema.methods.clearTyping = function(userId) {
  this.typing.delete(userId.toString());
  return this.save();
};

// Methods to manage unread counts
conversationSchema.methods.markAsRead = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

conversationSchema.methods.incrementUnread = function(userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  return this.save();
};

// Methods to manage pinned messages
conversationSchema.methods.pinMessage = function(messageId) {
  if (!this.pinnedMessages.includes(messageId)) {
    this.pinnedMessages.push(messageId);
  }
  return this.save();
};

conversationSchema.methods.unpinMessage = function(messageId) {
  this.pinnedMessages = this.pinnedMessages.filter(
    id => id.toString() !== messageId.toString()
  );
  return this.save();
};

// Methods to manage archived status
conversationSchema.methods.setArchived = function(userId, archived) {
  this.archived.set(userId.toString(), archived);
  return this.save();
};

// Methods to manage media gallery
conversationSchema.methods.addToGallery = function(messageId, media) {
  if (media.type.startsWith("image")) {
    this.mediaGallery.images.push({
      messageId,
      url: media.url,
      thumbnail: media.thumbnail || media.url,
      createdAt: new Date(),
    });
  } else {
    this.mediaGallery.files.push({
      messageId,
      filename: media.filename,
      url: media.url,
      size: media.size,
      type: media.type,
      createdAt: new Date(),
    });
  }
  return this.save();
};

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
