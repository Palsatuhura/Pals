const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  emoji: {
    type: String,
    required: true,
  },
});

const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["image", "voice", "file"],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  filename: String,
  filesize: Number,
  mimeType: String,
});

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: function() {
        // Content is required only if there are no attachments
        return !this.attachments || this.attachments.length === 0;
      },
    },
    attachments: [attachmentSchema],
    reactions: [reactionSchema],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    edited: {
      type: Boolean,
      default: false,
    },
    editHistory: [{
      content: String,
      editedAt: Date,
    }],
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    formatting: {
      bold: [{ start: Number, end: Number }],
      italic: [{ start: Number, end: Number }],
      code: [{ start: Number, end: Number }],
    },
    links: [{
      url: String,
      preview: {
        title: String,
        description: String,
        image: String,
      },
    }],
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ "readBy.user": 1 });

// Virtual for formatted content
messageSchema.virtual("formattedContent").get(function() {
  if (!this.content || this.deleted) return "";
  
  let formatted = this.content;
  const formats = [];
  
  // Add all format ranges
  if (this.formatting.bold) {
    this.formatting.bold.forEach(range => {
      formats.push({ ...range, type: "bold" });
    });
  }
  if (this.formatting.italic) {
    this.formatting.italic.forEach(range => {
      formats.push({ ...range, type: "italic" });
    });
  }
  if (this.formatting.code) {
    this.formatting.code.forEach(range => {
      formats.push({ ...range, type: "code" });
    });
  }
  
  // Sort ranges from end to start to avoid position shifts
  formats.sort((a, b) => b.start - a.start);
  
  // Apply formatting
  formats.forEach(format => {
    const before = formatted.slice(0, format.start);
    const middle = formatted.slice(format.start, format.end);
    const after = formatted.slice(format.end);
    
    switch (format.type) {
      case "bold":
        formatted = `${before}**${middle}**${after}`;
        break;
      case "italic":
        formatted = `${before}*${middle}*${after}`;
        break;
      case "code":
        formatted = `${before}\`${middle}\`${after}`;
        break;
    }
  });
  
  return formatted;
});

// Pre-save middleware
messageSchema.pre("save", function(next) {
  // If content is being modified and message exists
  if (this.isModified("content") && !this.isNew) {
    this.edited = true;
    this.editHistory.push({
      content: this.content,
      editedAt: new Date(),
    });
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
