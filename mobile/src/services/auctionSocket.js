import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../config/api';

let socket = null;

export function getAuctionSocket() {
  if (!socket) {
    socket = io(getApiBaseUrl(), {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

export function joinAuctionRoom(auctionId, onUpdate) {
  const s = getAuctionSocket();
  const roomHandler = (payload) => onUpdate?.(payload);

  s.emit('join_auction', auctionId);
  s.on('auction_update', roomHandler);

  return () => {
    s.emit('leave_auction', auctionId);
    s.off('auction_update', roomHandler);
  };
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
