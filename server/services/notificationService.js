const webpush = require("web-push");
const User = require("../models/User");

class NotificationService {
  constructor() {
    // Generate VAPID keys if not already set in environment variables
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      const vapidKeys = webpush.generateVAPIDKeys();
      process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
      process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
    }

    webpush.setVapidDetails(
      "mailto:your-email@example.com", // Replace with your email
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  // Subscribe a user to push notifications
  async subscribe(userId, subscription) {
    try {
      await User.findByIdAndUpdate(userId, {
        $push: { pushSubscriptions: subscription },
      });
      return { success: true };
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(userId, endpoint) {
    try {
      await User.findByIdAndUpdate(userId, {
        $pull: { pushSubscriptions: { endpoint } },
      });
      return { success: true };
    } catch (error) {
      console.error("Error unsubscribing from notifications:", error);
      throw error;
    }
  }

  // Send notification to a specific user
  async sendToUser(userId, notification) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushSubscriptions.length) return;

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || "/icon.png",
        badge: notification.badge || "/badge.png",
        data: notification.data || {},
      });

      const sendPromises = user.pushSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, payload);
        } catch (error) {
          if (error.statusCode === 410) {
            // Subscription has expired or is no longer valid
            await this.unsubscribe(userId, subscription.endpoint);
          }
          console.error("Error sending push notification:", error);
        }
      });

      await Promise.all(sendPromises);
    } catch (error) {
      console.error("Error in sendToUser:", error);
      throw error;
    }
  }

  // Send notification for new message
  async sendNewMessageNotification(userId, message, sender) {
    const notification = {
      title: `New message from ${sender.username}`,
      body: message.content.length > 50 
        ? message.content.substring(0, 47) + "..."
        : message.content,
      icon: sender.profilePicture || "/default-avatar.png",
      data: {
        type: "new_message",
        messageId: message._id,
        conversationId: message.conversation,
        senderId: sender._id,
      },
    };

    await this.sendToUser(userId, notification);
  }

  // Send notification for missed call
  async sendMissedCallNotification(userId, caller) {
    const notification = {
      title: "Missed Call",
      body: `You missed a call from ${caller.username}`,
      icon: caller.profilePicture || "/default-avatar.png",
      data: {
        type: "missed_call",
        callerId: caller._id,
      },
    };

    await this.sendToUser(userId, notification);
  }

  // Send notification for friend request
  async sendFriendRequestNotification(userId, sender) {
    const notification = {
      title: "New Friend Request",
      body: `${sender.username} sent you a friend request`,
      icon: sender.profilePicture || "/default-avatar.png",
      data: {
        type: "friend_request",
        senderId: sender._id,
      },
    };

    await this.sendToUser(userId, notification);
  }

  // Get VAPID public key
  getPublicKey() {
    return process.env.VAPID_PUBLIC_KEY;
  }
}

module.exports = new NotificationService();
