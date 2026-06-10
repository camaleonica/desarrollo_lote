import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Button } from '../../components/ui/Button';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { colors, spacing, typography } from '../../theme';
import { fetchAuctionItem } from '../../services/loteApi';
import { getPieceImageSource } from '../../assets/auctionImages';
import { formatCurrency } from '../../utils/validation';
import { ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
export function AuctionDetailScreen({ route, navigation }) {
  const { auctionId, itemId, id } = route.params;
  const resolvedAuctionId = auctionId || id;
  const { isGuest } = useAuth();
  const { showDialog } = useDialog();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (itemId) {
          setItem(await fetchAuctionItem(resolvedAuctionId, itemId, { auth: !isGuest }));
        } else {
          navigation.replace('AuctionCatalog', { id: resolvedAuctionId });
        }
      } catch (error) {
        showDialog({
          title: 'Error',
          message: error instanceof ApiError ? error.message : 'No se pudo cargar la pieza',
          variant: 'error',
        });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [resolvedAuctionId, itemId, navigation, isGuest]);

  if (loading || !item) {
    return (
      <ScreenLayout shape="lightBlue" safe contentStyle={styles.center}>
        <ActivityIndicator color={colors.brown} />
      </ScreenLayout>
    );
  }

  const imageSource = getPieceImageSource(item);

  return (
    <ScreenLayout shape="lightBlue" safe>
      <ScreenHeader title="Detalle de pieza" shape="brown" onBack={() => navigation.goBack()} embedded />
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        <Text style={styles.badge}>Pieza #{item.numero_pieza || item.id}</Text>
        <Text style={styles.title}>{item.titulo}</Text>
        <Text style={styles.description}>{item.descripcion_completa || item.descripcion}</Text>
        {item.historia ? <Text style={styles.meta}>Historia: {item.historia}</Text> : null}
        <Text style={styles.price}>Precio base: {formatCurrency(item.precio_base)}</Text>
        <Text style={styles.meta}>Puja actual: {formatCurrency(item.precio_actual)}</Text>
        <Text style={styles.previewNote}>
          Vista previa del lote. Para pujar tenés que ingresar a la sala en vivo desde el catálogo de la subasta.
        </Text>
        <Button
          title="Volver al catálogo"
          variant="outline"
          onPress={() => navigation.navigate('AuctionCatalog', { id: resolvedAuctionId })}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  image: { width: '100%', height: 240, borderRadius: 16, backgroundColor: colors.lavender },
  badge: { ...typography.captionMd, color: colors.teal, marginTop: spacing.md },
  title: { ...typography.title, marginTop: spacing.sm },
  description: { ...typography.body, marginVertical: spacing.md, lineHeight: 22 },
  price: { ...typography.price, marginBottom: spacing.xs },
  meta: { ...typography.captionMd, marginBottom: spacing.sm },
  previewNote: {
    ...typography.captionMd,
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    color: colors.teal,
  },
});
