import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Surface } from '../../components/m3/Surface';
import { SummaryRow } from '../../components/m3/SummaryRow';
import { OptionCard } from '../../components/m3/OptionCard';
import { ListTile } from '../../components/m3/ListTile';
import { colors, spacing, typography } from '../../theme';
import { fetchAuction } from '../../services/loteApi';
import { getAuctionImageSource } from '../../assets/auctionImages';
import { formatCurrency } from '../../utils/validation';
import { svgAssets } from '../../assets/svg';

const COMMISSION_RATE = 0.1;

export function WonAuctionScreen({ route, navigation }) {
  const { auctionId, monto } = route.params;
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState('envio');
  const [paymentMethod] = useState('Tarjeta de crédito ·••• 4242');

  useEffect(() => {
    (async () => {
      try {
        setAuction(await fetchAuction(auctionId));
      } finally {
        setLoading(false);
      }
    })();
  }, [auctionId]);

  const GanoIcon = svgAssets.ganoPuja;
  const finalAmount = monto || auction?.precio_actual || 0;
  const commission = Math.round(finalAmount * COMMISSION_RATE);
  const total = finalAmount + commission;

  function handleFinish() {
    navigation.navigate('DeliveryConfirmation', {
      auctionId,
      monto: total,
      delivery,
      titulo: auction?.titulo,
    });
  }

  if (loading) {
    return (
      <ScreenLayout shape="lavender" safe contentStyle={styles.center}>
        <ActivityIndicator color={colors.brown} size="large" />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader
        title="Resumen de compra"
        subtitle="Pieza ganada"
        shape="brown"
        onBack={() => navigation.goBack()}
        embedded
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Surface style={styles.hero}>
          <GanoIcon width={140} height={44} />
          <Text style={styles.congrats}>¡Felicidades! Ganaste la subasta</Text>
          <View style={styles.badge}>
            <MaterialIcons name="emoji-events" size={16} color={colors.ochre} />
            <Text style={styles.badgeText}>Puja ganadora confirmada</Text>
          </View>
        </Surface>

        {auction ? (
          <Surface style={styles.pieceCard}>
            <Text style={styles.sectionTitle}>Detalle de la pieza</Text>
            <Image
              source={getAuctionImageSource(auction)}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.pieceTitle}>{auction.titulo}</Text>
            <View style={styles.metaRow}>
              <MaterialIcons name="category" size={16} color={colors.teal} />
              <Text style={styles.metaText}>{auction.categoria}</Text>
            </View>
            <Text style={styles.description} numberOfLines={3}>
              {auction.descripcion}
            </Text>
          </Surface>
        ) : null}

        <Surface>
          <Text style={styles.sectionTitle}>Montos</Text>
          <SummaryRow label="Monto final de la puja" value={formatCurrency(finalAmount)} />
          <SummaryRow
            label={`Comisión (${Math.round(COMMISSION_RATE * 100)}%)`}
            value={formatCurrency(commission)}
            highlight
          />
          <SummaryRow label="Total a pagar" value={formatCurrency(total)} isTotal />
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Forma de pago</Text>
          <ListTile
            title={paymentMethod}
            subtitle="Medio predeterminado del perfil"
            icon="credit-card"
            iconColor={colors.brown}
            onPress={() => navigation.navigate('PaymentMethods')}
          />
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Opciones de entrega</Text>
          <OptionCard
            title="Envío a domicilio"
            subtitle="Recibí la pieza en tu domicilio legal"
            icon="local-shipping"
            selected={delivery === 'envio'}
            onPress={() => setDelivery('envio')}
          />
          <OptionCard
            title="Retiro presencial"
            subtitle="Retirá en la sala de subastas"
            icon="storefront"
            selected={delivery === 'retiro'}
            onPress={() => setDelivery('retiro')}
          />
        </Surface>

        <Button title="Finalizar compra" onPress={handleFinish} />
        <Button
          title="Volver a la sala"
          variant="outline"
          onPress={() => navigation.navigate('AuctionRoom', { id: auctionId })}
        />
        <Button
          title="Volver al inicio"
          variant="secondary"
          onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  congrats: { ...typography.titleSm, textAlign: 'center', color: colors.brown },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.lightBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    marginTop: spacing.xs,
  },
  badgeText: { ...typography.captionMd, color: colors.ochre, fontSize: 12 },
  pieceCard: { gap: spacing.sm },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.brown,
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.lavender,
  },
  pieceTitle: { ...typography.titleSm, fontSize: 18, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { ...typography.captionMd, color: colors.teal },
  description: { ...typography.body, lineHeight: 22 },
});
