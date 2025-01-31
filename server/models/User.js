const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const sessionSchema = new mongoose.Schema({
  token: String,
  device: String,
  lastActive: {
    type: Date,
    default: Date.now,
  },
  ip: String,
});

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v) {
          return /^[A-Z]{2}-[A-Z0-9]{4}-\d{4}[A-Z]$/.test(v);
        },
        message: (props) => `${props.value} is not a valid session ID format!`,
      },
    },
    profilePicture: {
      type: String,
      default: "",
    },
    online: {
      type: Boolean,
      default: false,
    },
    Isonline: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
    },
    onlineStatus: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
    },
    statusPrivacy: {
      type: String,
      enum: ["everyone", "contacts", "nobody"],
      default: "everyone",
    },
    statusMessage: {
      type: String,
      maxLength: 100,
      default: "",
    },
    sessions: [sessionSchema],
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      notifications: {
        sound: {
          type: Boolean,
          default: true,
        },
        desktop: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: true,
        },
      },
      privacy: {
        lastSeen: {
          type: String,
          enum: ["everyone", "contacts", "nobody"],
          default: "everyone",
        },
        profilePhoto: {
          type: String,
          enum: ["everyone", "contacts", "nobody"],
          default: "everyone",
        },
        status: {
          type: String,
          enum: ["everyone", "contacts", "nobody"],
          default: "everyone",
        },
      },
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    contacts: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        nickname: String,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false,
      },
      secret: String,
      backupCodes: [String],
    },
    pushSubscriptions: [
      {
        endpoint: String,
        keys: {
          p256dh: String,
          auth: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
userSchema.index({ username: 1 });
userSchema.index({ status: 1 });
userSchema.index({ "contacts.user": 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get user's privacy setting for a specific feature
userSchema.methods.getPrivacySetting = function (feature, requestingUserId) {
  const setting = this.settings.privacy[feature];

  if (setting === "everyone") return true;
  if (setting === "nobody") return false;
  if (setting === "contacts") {
    return this.contacts.some(
      (contact) => contact.user.toString() === requestingUserId.toString()
    );
  }
  return false;
};

// Check if user has blocked another user
userSchema.methods.hasBlocked = function (userId) {
  return this.blockedUsers.some(
    (blockedId) => blockedId.toString() === userId.toString()
  );
};

// Get user's visible status based on privacy settings
userSchema.methods.getVisibleStatus = function (requestingUserId) {
  if (!this.getPrivacySetting("status", requestingUserId)) {
    return null;
  }
  return {
    status: this.status,
    statusMessage: this.statusMessage,
  };
};

// Get user's visible last seen based on privacy settings
userSchema.methods.getVisibleLastSeen = function (requestingUserId) {
  if (!this.getPrivacySetting("lastSeen", requestingUserId)) {
    return null;
  }
  return this.lastActive;
};

// Update last seen
userSchema.methods.updateLastSeen = async function () {
  this.lastSeen = new Date();
  this.isOnline = false;
  await this.save();
};

// Set user as online
userSchema.methods.setOnline = async function () {
  this.isOnline = true;
  this.onlineStatus = "online";
  this.lastSeen = new Date();
  await this.save();
};

// Set user as offline
userSchema.methods.setOffline = async function () {
  this.isOnline = false;
  this.onlineStatus = "offline";
  this.lastSeen = new Date();
  await this.save();
};

// Format last seen
userSchema.methods.formatLastSeen = function () {
  if (this.isOnline) return "online";

  const now = new Date();
  const lastSeen = new Date(this.lastSeen);
  const diffTime = Math.abs(now - lastSeen);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffDays > 0) {
    return `last seen ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `last seen ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffMinutes > 0) {
    return `last seen ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "last seen just now";
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
