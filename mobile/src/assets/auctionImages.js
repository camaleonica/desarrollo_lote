import { getApiBaseUrl } from '../config/api';

const images = {
  1: require('../../assets/images/auctions/auction-1.webp'),
  2: require('../../assets/images/auctions/auction-2.webp'),
  3: require('../../assets/images/auctions/auction-3.webp'),
  4: require('../../assets/images/auctions/auction-4.webp'),
  5: require('../../assets/images/auctions/auction-5.webp'),
};

function resolveRemoteImage(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http')) return { uri: url };
  const path = url.startsWith('/') ? url : `/${url}`;
  return { uri: `${getApiBaseUrl()}${path}` };
}

export function getAuctionImageSource(auction) {
  if (!auction) return images[1];

  const remote = resolveRemoteImage(auction.imagen_url)
    || resolveRemoteImage(auction.fotos?.[0]?.url)
    || resolveRemoteImage(auction.pieza_actual?.imagen_url);
  if (remote) return remote;

  if (auction.id && images[auction.id]) return images[auction.id];

  const index = ((Number(auction.id) || 1) - 1) % 5 + 1;
  return images[index] || images[1];
}

export function getPieceImageSource(item) {
  if (!item) return images[1];
  const remote = resolveRemoteImage(item.imagen_url) || resolveRemoteImage(item.fotos?.[0]?.url);
  if (remote) return remote;
  return getAuctionImageSource(item);
}
