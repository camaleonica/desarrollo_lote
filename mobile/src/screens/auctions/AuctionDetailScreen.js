import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { colors, spacing, typography } from '../../theme';
import { fetchAuction } from '../../services/loteApi';
import { getAuctionImageSource } from '../../assets/auctionImages';
import { formatCurrency } from '../../utils/validation';
import { ApiError } from '../../services/api';
import { useDialog } from '../../context/DialogContext';

export function AuctionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { showDialog } = useDialog();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setAuction(await fetchAuction(id));
      } catch (error) {
        showDialog({
          title: 'Error',
          message: error instanceof ApiError ? error.message : 'No se pudo cargar la subasta',
          variant: 'error',
        });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigation]);

  if (loading || !auction) {
    return (
      <ScreenLayout shape="lightBlue" safe contentStyle={styles.center}>
        <ActivityIndicator color={colors.brown} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout shape="lightBlue" safe>
      <ScreenHeader title="Detalle de pieza" shape="brown" onBack={() => navigation.goBack()} embedded />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={getAuctionImageSource(auction)} style={styles.image} resizeMode="cover" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{auction.categoria}</Text>
        </View>
        <Text style={styles.title}>{auction.titulo}</Text>
        <Text style={styles.description}>{auction.descripcion}</Text>
        <Text style={styles.price}>Puja actual: {formatCurrency(auction.precio_actual)}</Text>
        <Text style={styles.meta}>Incremento mínimo: {formatCurrency(auction.incremento_minimo)}</Text>
        {auction.puja_lider ? (
          <Text style={styles.meta}>
            Líder: {auction.puja_lider.nombre} {auction.puja_lider.apellido}
          </Text>
        ) : null}
        <Button title="Entrar a la subasta" onPress={() => navigation.navigate('AuctionRoom', { id: auction.id })} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  image: { width: '100%', height: 240, borderRadius: 16, backgroundColor: colors.lavender },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lightBlue,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  badgeText: { ...typography.label, color: colors.teal },
  title: { ...typography.title, marginTop: spacing.md },
  description: { ...typography.body, marginVertical: spacing.md, lineHeight: 22 },
  price: { ...typography.price, marginBottom: spacing.xs },
  meta: { ...typography.captionMd, marginBottom: spacing.sm },
});
