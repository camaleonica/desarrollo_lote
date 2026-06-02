import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuctionImageSource } from '../assets/auctionImages';
import { colors, radius, spacing, typography } from '../theme';
import { formatCurrency } from '../utils/validation';

export function AuctionCard({ auction, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Image source={getAuctionImageSource(auction)} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.badge}>
            <MaterialIcons name="category" size={14} color={colors.teal} />
            <Text style={styles.badgeText}>{auction.categoria}</Text>
          </View>
          <View style={styles.livePill}>
            <MaterialIcons name="circle" size={8} color={colors.ochre} />
            <Text style={styles.liveText}>En vivo</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {auction.titulo}
        </Text>
        <View style={styles.priceRow}>
          <MaterialIcons name="payments" size={18} color={colors.ochre} />
          <Text style={styles.price}>Puja actual: {formatCurrency(auction.precio_actual)}</Text>
        </View>
        <View style={styles.ctaRow}>
          <Text style={styles.cta}>Ver detalle</Text>
          <MaterialIcons name="arrow-forward" size={18} color={colors.brown} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lavender,
    shadowColor: colors.brown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: { opacity: 0.94 },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: colors.lavender,
  },
  content: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lightBlue,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: {
    ...typography.captionMd,
    fontSize: 12,
    color: colors.teal,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveText: {
    ...typography.captionMd,
    fontSize: 12,
    color: colors.ochre,
  },
  title: {
    ...typography.label,
    fontSize: 17,
    marginBottom: spacing.sm,
    color: colors.brown,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  price: {
    ...typography.captionMd,
    color: colors.ochre,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing.sm,
  },
  cta: {
    ...typography.label,
    color: colors.brown,
  },
});
