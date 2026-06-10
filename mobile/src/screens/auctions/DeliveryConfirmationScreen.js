import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Surface } from '../../components/m3/Surface';
import { ListTile } from '../../components/m3/ListTile';
import { SummaryRow } from '../../components/m3/SummaryRow';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils/validation';
import { fetchDelivery } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useDialog } from '../../context/DialogContext';

export function DeliveryConfirmationScreen({ route, navigation }) {
  const { purchaseId, delivery = 'envio', monto = 0, titulo = 'Tu pieza' } = route.params || {};
  const { showDialog } = useDialog();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(Boolean(purchaseId));

  useEffect(() => {
    if (!purchaseId) return;
    (async () => {
      try {
        setInfo(await fetchDelivery(purchaseId));
      } catch (error) {
        showDialog({
          title: 'Aviso',
          message: error instanceof ApiError ? error.message : 'No se pudo cargar el detalle de entrega',
          variant: 'warning',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [purchaseId]);

  const metodoLabel = info?.metodo_label || (delivery === 'retiro' ? 'Retiro presencial' : 'Envío a domicilio');
  const estadoLabel = info?.estado_label || 'Pendiente';
  const detalle = info?.direccion_entrega || info?.retiro_ubicacion || 'Te contactaremos con los próximos pasos.';
  const total = info?.total ?? monto;

  if (loading) {
    return (
      <ScreenLayout shape="lavender" safe contentStyle={styles.center}>
        <ActivityIndicator color={colors.brown} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader title="Confirmación de entrega" subtitle="Compra registrada" shape="brown" embedded />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Surface style={styles.success}>
          <MaterialIcons name="check-circle" size={56} color={colors.teal} />
          <Text style={styles.successTitle}>¡Compra finalizada!</Text>
          <Text style={styles.successSubtitle}>{info?.titulo || titulo}</Text>
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Método seleccionado</Text>
          <ListTile title={metodoLabel} subtitle={estadoLabel} icon={delivery === 'retiro' ? 'storefront' : 'local-shipping'} iconColor={colors.teal} />
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Estado de entrega</Text>
          <Text style={styles.detailText}>{detalle}</Text>
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Resumen del pago</Text>
          <SummaryRow label="Total registrado" value={formatCurrency(total)} isTotal />
        </Surface>

        <Button title="Volver al inicio" onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} />
        <Button title="Ver mis pujas" variant="outline" onPress={() => navigation.navigate('Tabs', { screen: 'Activities' })} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  success: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  successTitle: { ...typography.titleSm, color: colors.brown, textAlign: 'center' },
  successSubtitle: { ...typography.body, textAlign: 'center' },
  sectionTitle: { ...typography.bodyBold, color: colors.brown, marginBottom: spacing.sm },
  detailText: { ...typography.body, lineHeight: 22, color: colors.text },
});
