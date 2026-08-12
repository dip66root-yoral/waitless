const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'waitless_super_secret_key_2024';

// Track online users by their userId
const onlineUsers = new Set();

function initSocket(io) {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.userId;
      } catch (e) {
        // invalid token, just proceed anonymously
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    if (socket.userId) {
      onlineUsers.add(socket.userId);
    }

    // Join a queue room (for queue-wide updates)
    socket.on('join:queue', (queueId) => {
      socket.join(queueId);
      console.log(`  ↳ Joined queue room: ${queueId}`);
    });

    // Join a personal token room (for "your turn" notifications)
    socket.on('join:token', (tokenId) => {
      socket.join(`token:${tokenId}`);
      console.log(`  ↳ Joined token room: token:${tokenId}`);
    });

    // Leave rooms
    socket.on('leave:queue', (queueId) => {
      socket.leave(queueId);
    });

    socket.on('leave:token', (tokenId) => {
      socket.leave(`token:${tokenId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      if (socket.userId) {
        // Only remove if they don't have other active tabs (sockets)
        // A simple implementation just removes them, but ideally we check if other sockets share the userId.
        // For now, removing is fine to show them as offline.
        onlineUsers.delete(socket.userId);
      }
    });
  });
}

module.exports = { initSocket, onlineUsers };
