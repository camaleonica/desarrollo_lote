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
import { Button } from '../../components/ui/Button';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Surface } from '../../components/m3/Surface';
import { SummaryRow } from '../../components/m3/SummaryRow';
import { OptionCard } from '../../components/m3/OptionCard';
import { ListTile } from '../../components/m3/ListTile';
import { colors, spacing, typography } from '../../theme';
import { fetchAuction, finalizePurchase, fetchPaymentMethods } from '../../services/loteApi';
import { getAuctionImageSource } from '../../assets/auctionImages';
import { formatCurrency } from '../../utils/validation';
import { svgAssets } from '../../assets/icons';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';
import { useDialog } from '../../context/DialogContext';

export function WonAuctionScreen({ route, navigation }) {
  const { auctionId, monto, itemId } = route.params;
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const [auction, setAuction] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState('envio');

  useEffect(() => {
    (async () => {
      try {
        const [auctionData, methods] = await Promise.all([
          fetchAuction(auctionId),
          fetchPaymentMethods(),
        ]);
        setAuction(auctionData);
        const defaultMethod = methods.find((m) => m.id === user?.medio_pago_default_id) || methods[0];
        setPaymentMethod(defaultMethod);
      } finally {
        setLoading(false);
      }
    })();
  }, [auctionId, user?.medio_pago_default_id]);

  const GanoIcon = svgAssets.ganoPuja;
  const finalAmount = monto || auction?.precio_actual || 0;
  const commission = Number(auction?.comision || Math.round(finalAmount * 0.1));
  const total = finalAmount + commission;

  async function handleFinish() {
    setSubmitting(true);
    try {
      const result = await finalizePurchase(auctionId, {
        monto: finalAmount,
        item_id: itemId || auction?.pieza_actual?.id,
        metodo_entrega: delivery,
        medio_pago_id: paymentMethod?.id,
        direccion_entrega: user?.domicilio,
      });

      navigation.navigate('DeliveryConfirmation', {
        purchaseId: result.purchase.id,
        delivery,
        monto: result.purchase.total,
        titulo: auction?.titulo,
      });
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudo finalizar la compra',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
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
      <ScreenHeader title="Resumen de compra" subtitle="Pieza ganada" shape="brown" onBack={() => navigation.goBack()} embedded />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Surface style={styles.hero}>
          <GanoIcon width={140} height={44} />
          <Text style={styles.congrats}>¡Felicidades! Ganaste la subasta</Text>
        </Surface>

        {auction ? (
          <Surface style={styles.pieceCard}>
            <Text style={styles.sectionTitle}>Detalle de la pieza</Text>
            <Image source={getAuctionImageSource(auction)} style={styles.image} resizeMode="cover" />
            <Text style={styles.pieceTitle}>{auction.titulo}</Text>
            <Text style={styles.description} numberOfLines={3}>{auction.descripcion}</Text>
          </Surface>
        ) : null}

        <Surface>
          <Text style={styles.sectionTitle}>Montos</Text>
          <SummaryRow label="Monto final de la puja" value={formatCurrency(finalAmount)} />
          <SummaryRow label="Comisión" value={formatCurrency(commission)} highlight />
          <SummaryRow label="Total a pagar" value={formatCurrency(total)} isTotal />
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Forma de pago</Text>
          <ListTile
            title={paymentMethod?.label || paymentMethod?.tipo || 'Medio predeterminado'}
            subtitle="Medio predeterminado del perfil"
            icon="credit-card"
            iconColor={colors.brown}
            onPress={() => navigation.navigate('PaymentMethods')}
          />
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Opciones de entrega</Text>
          <OptionCard title="Envío a domicilio" subtitle="Recibí la pieza en tu domicilio legal" icon="local-shipping" selected={delivery === 'envio'} onPress={() => setDelivery('envio')} />
          <OptionCard title="Retiro presencial" subtitle="Retirá en la sala de subastas" icon="storefront" selected={delivery === 'retiro'} onPress={() => setDelivery('retiro')} />
        </Surface>

        <Button title="Finalizar compra" onPress={handleFinish} loading={submitting} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  congrats: { ...typography.titleSm, textAlign: 'center', color: colors.brown },
  pieceCard: { gap: spacing.sm },
  sectionTitle: { ...typography.bodyBold, color: colors.brown, marginBottom: spacing.sm },
  image: { width: '100%', height: 160, borderRadius: 12, backgroundColor: colors.lavender },
  pieceTitle: { ...typography.titleSm, fontSize: 18, marginTop: spacing.xs },
  description: { ...typography.body, lineHeight: 22 },
});
