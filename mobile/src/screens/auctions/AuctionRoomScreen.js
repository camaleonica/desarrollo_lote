import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Surface } from '../../components/m3/Surface';
import { colors, spacing, typography } from '../../theme';
import { fetchAuction, placeBid } from '../../services/loteApi';
import { getAuctionImageSource } from '../../assets/auctionImages';
import { formatCurrency } from '../../utils/validation';
import { ApiError } from '../../services/api';
import { useDialog } from '../../context/DialogContext';

const STREAM_URL = 'https://www.youtube.com/watch?v=live';

function formatCountdown(secondsLeft) {
  if (secondsLeft <= 0) return '00:00';
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AuctionRoomScreen({ route, navigation }) {
  const { id } = route.params;
  const { showDialog } = useDialog();
  const [auction, setAuction] = useState(null);
  const [monto, setMonto] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  async function loadAuction() {
    try {
      const data = await fetchAuction(id);
      setAuction(data);
      setMonto(String(data.precio_actual + data.incremento_minimo));
      if (data.fecha_fin) {
        const diff = Math.max(0, Math.floor((new Date(data.fecha_fin).getTime() - Date.now()) / 1000));
        setSecondsLeft(diff > 0 ? diff : 45 * 60);
      }
    } catch (err) {
      showDialog({
        title: 'Error',
        message: err instanceof ApiError ? err.message : 'No se pudo cargar la sala',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuction();
    const interval = setInterval(loadAuction, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [id]);

  function quickBid(extra) {
    if (!auction) return;
    setMonto(String(auction.precio_actual + extra));
    setError('');
  }

  async function handleBid() {
    const value = Number(monto);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Ingresá un monto válido');
      return;
    }

    setSubmitting(true);
    try {
      await placeBid(id, value);
      await loadAuction();
      setError('');
      showDialog({
        title: '¡Puja registrada!',
        message: `Tu oferta de ${formatCurrency(value)} quedó activa en la subasta.`,
        variant: 'success',
        buttons: [
          { text: 'Seguir pujando', style: 'outline' },
          {
            text: 'Ver resumen',
            style: 'primary',
            onPress: () => navigation.navigate('WonAuction', { auctionId: id, monto: value }),
          },
        ],
      });
    } catch (err) {
      if (err instanceof ApiError && err.errors?.monto) {
        setError(err.errors.monto);
      } else {
        showDialog({
          title: 'No se pudo pujar',
          message: err instanceof ApiError ? err.message : 'Intentá de nuevo en unos segundos.',
          variant: 'error',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openStream() {
    Linking.openURL(STREAM_URL).catch(() => {
      showDialog({
        title: 'Streaming',
        message: 'No se pudo abrir el enlace. Intentá más tarde.',
        variant: 'warning',
      });
    });
  }

  if (loading || !auction) {
    return (
      <ScreenLayout shape="lightBlue" safe contentStyle={styles.center}>
        <ActivityIndicator color={colors.brown} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout shape="lightBlue" safe contentStyle={styles.layout}>
      <ScreenHeader
        title="Sala en vivo"
        subtitle={auction.titulo}
        shape="brown"
        onBack={() => navigation.goBack()}
        embedded
      />

      <View style={styles.body}>
        <Surface style={styles.liveCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveBadge}>
              <MaterialIcons name="circle" size={8} color={colors.white} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
            <View style={styles.timerWrap}>
              <MaterialIcons name="timer" size={16} color={colors.ochre} />
              <Text style={styles.timerText}>{formatCountdown(secondsLeft)}</Text>
            </View>
          </View>

          <View style={styles.pieceRow}>
            <Image source={getAuctionImageSource(auction)} style={styles.image} resizeMode="cover" />
            <View style={styles.pieceInfo}>
              <Text style={styles.pieceTitle} numberOfLines={2}>
                {auction.titulo}
              </Text>
              <Text style={styles.pieceMeta}>{auction.categoria}</Text>
              <Text style={styles.currentLabel}>Mejor oferta</Text>
              <Text style={styles.currentValue}>{formatCurrency(auction.precio_actual)}</Text>
              {auction.puja_lider ? (
                <Text style={styles.leaderText} numberOfLines={1}>
                  Líder: {auction.puja_lider.nombre} {auction.puja_lider.apellido}
                </Text>
              ) : null}
            </View>
          </View>

          <Pressable style={styles.streamLink} onPress={openStream}>
            <MaterialIcons name="live-tv" size={18} color={colors.teal} />
            <Text style={styles.streamText}>Ver transmisión</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>

          <Text style={styles.hint}>
            Hay otros participantes conectados. Las pujas se actualizan en tiempo real.
          </Text>
        </Surface>

        <Surface style={styles.bidCard}>
          <Text style={styles.sectionLabel}>Tu puja</Text>
          <View style={styles.quickRow}>
            {[auction.incremento_minimo, auction.incremento_minimo * 2, auction.incremento_minimo * 5].map(
              (inc) => (
                <Button
                  key={inc}
                  title={`+${formatCurrency(inc)}`}
                  variant="outline"
                  onPress={() => quickBid(inc)}
                  style={styles.quickBtn}
                />
              )
            )}
          </View>
          <Input
            label="Monto a ofertar"
            value={monto}
            onChangeText={setMonto}
            keyboardType="numeric"
            error={error}
          />
          <Button title="Pujar" onPress={handleBid} loading={submitting} />
        </Surface>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  layout: { flex: 1 },
  body: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  liveCard: { gap: spacing.sm },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.ochre,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveText: { ...typography.caption, fontSize: 11, color: colors.white },
  timerWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { ...typography.label, color: colors.ochre, fontSize: 14 },
  pieceRow: { flexDirection: 'row', gap: spacing.md },
  image: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.lavender,
  },
  pieceInfo: { flex: 1, justifyContent: 'center' },
  pieceTitle: { ...typography.bodyBold, color: colors.brown, fontSize: 16 },
  pieceMeta: { ...typography.captionMd, color: colors.teal, fontSize: 12, marginTop: 2 },
  currentLabel: { ...typography.captionMd, fontSize: 11, marginTop: spacing.xs },
  currentValue: { ...typography.price, fontSize: 22, color: colors.brown },
  leaderText: { ...typography.captionMd, fontSize: 12, marginTop: 2 },
  streamLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  streamText: { ...typography.label, color: colors.teal, flex: 1 },
  hint: { ...typography.captionMd, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  bidCard: { gap: spacing.sm },
  sectionLabel: { ...typography.label, color: colors.textMuted },
  quickRow: { flexDirection: 'row', gap: spacing.xs },
  quickBtn: { flex: 1, minHeight: 40, paddingVertical: spacing.sm },
});
