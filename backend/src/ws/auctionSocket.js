let ioInstance = null;

function initAuctionSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    socket.on('join_auction', (auctionId) => {
      if (auctionId) socket.join(`auction:${auctionId}`);
    });

    socket.on('leave_auction', (auctionId) => {
      if (auctionId) socket.leave(`auction:${auctionId}`);
    });
  });
}

function emitAuctionUpdate(auctionId, payload) {
  if (!ioInstance) return;
  ioInstance.to(`auction:${auctionId}`).emit('auction_update', payload);
}

function getIO() {
  return ioInstance;
}

module.exports = { initAuctionSocket, emitAuctionUpdate, getIO };
