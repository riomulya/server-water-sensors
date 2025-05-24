/**
 * Socket.IO instance management
 * This module provides a way to access the Socket.IO instance across the application
 */

let ioInstance = null;

/**
 * Set the Socket.IO instance
 * @param {Object} io - The Socket.IO server instance
 */
const setIoInstance = (io) => {
  ioInstance = io;
  console.log('[SOCKET] Socket.IO instance set');
};

/**
 * Get the Socket.IO instance
 * @returns {Object|null} The Socket.IO server instance or null if not set
 */
const getIoInstance = () => {
  return ioInstance;
};

module.exports = {
  setIoInstance,
  getIoInstance,
};
