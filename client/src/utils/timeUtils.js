export const formatLastSeen = (lastSeenDate) => {
  if (!lastSeenDate) return "Never";

  const now = new Date();
  const lastSeen = new Date(lastSeenDate);
  const diffInMs = now - lastSeen;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Format time in 12-hour format with am/pm
  const formatTime = (date) => {
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase();
  };

  // If online in the last minute
  if (diffInMinutes < 1) {
    return "online";
  }

  // If last seen today
  if (lastSeen.getDate() === now.getDate() && 
      lastSeen.getMonth() === now.getMonth() && 
      lastSeen.getFullYear() === now.getFullYear()) {
    return `last seen today at ${formatTime(lastSeen)}`;
  }

  // If last seen yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (lastSeen.getDate() === yesterday.getDate() && 
      lastSeen.getMonth() === yesterday.getMonth() && 
      lastSeen.getFullYear() === yesterday.getFullYear()) {
    return `last seen yesterday at ${formatTime(lastSeen)}`;
  }

  // If last seen this week (within 7 days)
  if (diffInDays < 7) {
    const day = lastSeen.toLocaleString('en-US', { weekday: 'long' });
    return `last seen ${day} at ${formatTime(lastSeen)}`;
  }

  // If last seen more than 7 days ago
  return lastSeen.toLocaleString('en-US', { 
    month: 'long',
    day: 'numeric',
    year: lastSeen.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
