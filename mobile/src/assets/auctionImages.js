const images = {
  1: require('../../assets/auctions/auction-1.webp'),
  2: require('../../assets/auctions/auction-2.webp'),
  3: require('../../assets/auctions/auction-3.webp'),
  4: require('../../assets/auctions/auction-4.webp'),
  5: require('../../assets/auctions/auction-5.webp'),
  'auction-1': require('../../assets/auctions/auction-1.webp'),
  'auction-2': require('../../assets/auctions/auction-2.webp'),
  'auction-3': require('../../assets/auctions/auction-3.webp'),
  'auction-4': require('../../assets/auctions/auction-4.webp'),
  'auction-5': require('../../assets/auctions/auction-5.webp'),
};

export function getAuctionImageSource(auction) {
  if (!auction) return images[1];

  if (auction.id && images[auction.id]) return images[auction.id];
  if (auction.imagen_url && images[auction.imagen_url]) return images[auction.imagen_url];
  if (typeof auction.imagen_url === 'string' && auction.imagen_url.startsWith('http')) {
    return { uri: auction.imagen_url };
  }

  const index = ((auction.id || 1) - 1) % 5 + 1;
  return images[index] || images[1];
}
