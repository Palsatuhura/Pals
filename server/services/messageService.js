const linkify = require("linkifyjs");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const webpush = require("web-push");
const User = require("../models/User");

class MessageService {
  // Format message content with markdown-style formatting
  formatMessage(content, formatting) {
    if (!content) return "";
    
    let formatted = content;
    const formats = [];
    
    // Collect all format ranges
    if (formatting) {
      if (formatting.bold) {
        formatting.bold.forEach(range => {
          formats.push({ ...range, type: "bold" });
        });
      }
      if (formatting.italic) {
        formatting.italic.forEach(range => {
          formats.push({ ...range, type: "italic" });
        });
      }
      if (formatting.code) {
        formatting.code.forEach(range => {
          formats.push({ ...range, type: "code" });
        });
      }
    }
    
    // Sort ranges from end to start
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
  }

  // Extract links from message content
  extractLinks(content) {
    return linkify.find(content)
      .filter(link => link.type === "url")
      .map(link => link.href);
  }

  // Fetch link preview data
  async fetchLinkPreview(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      return {
        url,
        title: $("title").text() || $('meta[property="og:title"]').attr("content"),
        description: $('meta[name="description"]').attr("content") || 
                    $('meta[property="og:description"]').attr("content"),
        image: $('meta[property="og:image"]').attr("content"),
      };
    } catch (error) {
      console.error("Error fetching link preview:", error);
      return { url };
    }
  }

  // Process message before saving
  async processMessage(messageData) {
    try {
      // Extract links
      const links = this.extractLinks(messageData.content);

      // Create message
      const message = new Message({
        ...messageData,
        links: links,
      });

      await message.save();

      // Send push notifications to subscribed users
      const users = await User.find({ "pushSubscriptions.endpoint": { $exists: true } });
      const payload = {
        title: `New message from ${messageData.sender}`,
        body: messageData.content,
        icon: "/icon.png",
      };

      users.forEach(user => {
        user.pushSubscriptions.forEach(subscription => {
          webpush.sendNotification(subscription, JSON.stringify(payload))
            .catch(error => {
              console.error("Error sending notification:", error);
            });
        });
      });

      // Update conversation
      await Conversation.findByIdAndUpdate(
        messageData.conversation,
        {
          lastMessage: message._id,
          $inc: { [`unreadCount.${messageData.sender}`]: 1 },
        },
        { new: true }
      );

      return message;
    } catch (error) {
      console.error("Error processing message:", error);
      throw error;
    }
  }

  // Edit message
  async editMessage(messageId, newContent, formatting) {
    try {
      const message = await Message.findById(messageId);
      if (!message) throw new Error("Message not found");

      // Store old content in edit history
      message.editHistory.push({
        content: message.content,
        editedAt: new Date(),
      });

      // Update content and formatting
      message.content = newContent;
      message.formatting = formatting || {};
      message.edited = true;

      // Process links if content changed
      const links = this.extractLinks(newContent);
      message.links = await Promise.all(
        links.map(url => this.fetchLinkPreview(url))
      );

      await message.save();
      return message;
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) throw new Error("Message not found");

      message.deleted = true;
      message.deletedAt = new Date();
      message.content = "This message was deleted";
      
      await message.save();
      return message;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  }

  // Add reaction to message
  async addReaction(messageId, userId, emoji) {
    try {
      const message = await Message.findById(messageId);
      if (!message) throw new Error("Message not found");

      // Remove existing reaction from same user if exists
      message.reactions = message.reactions.filter(
        reaction => reaction.user.toString() !== userId.toString()
      );

      // Add new reaction
      message.reactions.push({ user: userId, emoji });

      await message.save();
      return message;
    } catch (error) {
      console.error("Error adding reaction:", error);
      throw error;
    }
  }

  // Remove reaction from message
  async removeReaction(messageId, userId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) throw new Error("Message not found");

      message.reactions = message.reactions.filter(
        reaction => reaction.user.toString() !== userId.toString()
      );

      await message.save();
      return message;
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw error;
    }
  }
}

module.exports = new MessageService();
