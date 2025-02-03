/**
 * Formats a username by capitalizing the first letter and making the rest lowercase
 * @param {string} username - The username to format
 * @returns {string} The formatted username
 */
export const formatUsername = (username) => {
  if (!username) return "Unknown User";
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
};

/**
 * Generates an avatar color based on the username
 * @param {string} username - The username to generate color for
 * @returns {string} The RGB color string
 */
export const generateAvatarColor = (username) => {
  if (!username) return "rgb(128, 128, 128)"; // Default gray for unknown users
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (Math.imul(31, hash) + username.charCodeAt(i)) | 0;
  }
  
  // Generate pastel colors by ensuring higher base values
  const r = 128 + (hash & 127);
  const g = 128 + ((hash >> 8) & 127);
  const b = 128 + ((hash >> 16) & 127);
  
  return `rgb(${r}, ${g}, ${b})`;
};
