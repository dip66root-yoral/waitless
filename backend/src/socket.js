function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

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
    });
  });
}

module.exports = { initSocket };
