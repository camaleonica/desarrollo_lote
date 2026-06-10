import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Image } from 'react-native';
import { getPieceImageSource } from '../../assets/auctionImages';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Surface } from '../../components/m3/Surface';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme';
import { fetchAuction, joinAuction } from '../../services/loteApi';
import { formatCurrency } from '../../utils/validation';
import { ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { GuestBanner } from '../../components/auth/GuestBanner';

export function AuctionCatalogScreen({ route, navigation }) {
  const { id } = route.params;
  const { isGuest, openAuthEntry } = useAuth();
  const { showDialog } = useDialog();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setAuction(await fetchAuction(id, { auth: !isGuest }));
      } catch (error) {
        showDialog({
          title: 'Error',
          message: error instanceof ApiError ? error.message : 'No se pudo cargar el catálogo',
          variant: 'error',
        });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigation, isGuest]);

  async function handleEnter() {
    if (isGuest) {
      openAuthEntry('RegisterStep1');
      return;
    }

    setJoining(true);
    try {
      await joinAuction(id);
      navigation.navigate('AuctionRoom', { id });
    } catch (error) {
      showDialog({
        title: 'No podés ingresar',
        message: error instanceof ApiError ? error.message : 'Verificá tu categoría y medios de pago',
        variant: 'warning',
      });
    } finally {
      setJoining(false);
    }
  }

  if (loading || !auction) {
    return (
      <ScreenLayout shape="lightBlue" safe contentStyle={styles.center}>
        <ActivityIndicator color={colors.brown} />
      </ScreenLayout>
    );
  }

  const catalogo = auction.catalogo || [];
  const piezaActualId = auction.pieza_actual?.id;
  const puedeIngresar = Boolean(auction.puede_ingresar ?? auction.puedeIngresar);
  const agotada = Boolean(auction.agotada);
  const canEnter = !isGuest && puedeIngresar && !agotada;

  let enterTitle = 'Ingresar a la subasta';
  if (isGuest) enterTitle = 'Registrate para participar';
  else if (agotada) enterTitle = 'Subasta sin stock';
  else if (!puedeIngresar) enterTitle = 'No podés ingresar';

  return (
    <ScreenLayout shape="lightBlue" safe>
      <ScreenHeader
        title="Catálogo de subasta"
        subtitle={auction.titulo}
        shape="brown"
        onBack={() => navigation.goBack()}
        embedded
      />
      <FlatList
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <GuestBanner compact />
            <Surface style={styles.infoCard}>
              <Text style={styles.infoTitle}>{auction.titulo}</Text>
              <Text style={styles.meta}>📅 {auction.fecha} · {auction.hora}</Text>
              <Text style={styles.meta}>📍 {auction.ubicacion}</Text>
              <Text style={styles.meta}>Rematador: {auction.subastador || 'A confirmar'}</Text>
              <Text style={styles.meta}>Moneda: {auction.moneda}</Text>
              {agotada ? (
                <Text style={styles.blocked}>{auction.motivo_agotada || 'Subasta sin piezas disponibles'}</Text>
              ) : null}
              {!agotada && !isGuest && !puedeIngresar ? (
                <Text style={styles.blocked}>
                  {auction.motivo_bloqueo || 'No cumplís los requisitos para participar'}
                </Text>
              ) : null}
              {isGuest ? (
                <Text style={styles.blocked}>Registrate y verificá tu identidad para participar.</Text>
              ) : null}
              <Button
                title={enterTitle}
                onPress={handleEnter}
                loading={joining}
                disabled={!isGuest && !canEnter}
              />
            </Surface>

            <View style={styles.catalogHeader}>
              <Text style={styles.catalogTitle}>
                Piezas de esta subasta ({catalogo.length})
              </Text>
              <Text style={styles.catalogHint}>
                Son los lotes que se subastan en vivo. Tocá una pieza para ver el detalle antes de ingresar a la sala.
              </Text>
            </View>
          </View>
        }
        data={catalogo}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.emptyCatalog}>Esta subasta aún no tiene piezas cargadas.</Text>
        }
        renderItem={({ item }) => {
          const esActual = piezaActualId != null && Number(item.id) === Number(piezaActualId);
          const vendida = Boolean(item.subastado);

          return (
            <Pressable
              style={[styles.pieceCard, vendida && styles.pieceCardSold]}
              onPress={() => navigation.navigate('AuctionDetail', { auctionId: id, itemId: item.id })}
            >
              <View style={styles.pieceRow}>
                <Image source={getPieceImageSource(item)} style={styles.pieceThumb} resizeMode="cover" />
                <View style={styles.pieceText}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.pieceNum}>Lote #{item.numero_pieza ?? item.id}</Text>
                    {esActual ? <Text style={styles.badgeLive}>En subasta ahora</Text> : null}
                    {vendida ? <Text style={styles.badgeSold}>Subastada</Text> : null}
                  </View>
                  <Text style={styles.pieceTitle}>{item.titulo || 'Pieza sin título'}</Text>
                  {item.descripcion ? (
                    <Text style={styles.pieceDesc} numberOfLines={2}>{item.descripcion}</Text>
                  ) : null}
                  <Text style={styles.piecePrice}>Precio base: {formatCurrency(item.precio_base)}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.brown} />
              </View>
            </Pressable>
          );
        }}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  infoCard: { gap: spacing.sm, marginBottom: spacing.md },
  infoTitle: { ...typography.titleSm },
  meta: { ...typography.captionMd, color: colors.textMuted },
  blocked: { ...typography.captionMd, color: colors.error, marginVertical: spacing.xs },
  catalogHeader: { marginBottom: spacing.md, gap: spacing.xs },
  catalogTitle: { ...typography.subtitle, color: colors.brown },
  catalogHint: { ...typography.captionMd, lineHeight: 20 },
  emptyCatalog: { ...typography.captionMd, textAlign: 'center', marginTop: spacing.md },
  pieceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lavender,
  },
  pieceCardSold: { opacity: 0.65 },
  pieceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pieceThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.lightBlue,
  },
  pieceText: { flex: 1 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  pieceNum: { ...typography.captionMd, color: colors.teal },
  badgeLive: {
    ...typography.caption,
    fontSize: 10,
    color: colors.white,
    backgroundColor: colors.ochre,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeSold: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    backgroundColor: colors.lavenderSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pieceTitle: { ...typography.bodyBold, marginTop: 2 },
  pieceDesc: { ...typography.captionMd, marginTop: 2 },
  piecePrice: { ...typography.label, color: colors.ochre, marginTop: 4 },
});
