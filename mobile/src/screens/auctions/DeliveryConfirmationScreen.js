import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Surface } from '../../components/m3/Surface';
import { ListTile } from '../../components/m3/ListTile';
import { SummaryRow } from '../../components/m3/SummaryRow';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils/validation';

const DELIVERY_INFO = {
  envio: {
    title: 'Envío a domicilio',
    icon: 'local-shipping',
    status: 'Pendiente de despacho',
    detail: 'Av. Corrientes 1234, CABA\nEntrega estimada: 5 a 7 días hábiles',
  },
  retiro: {
    title: 'Retiro presencial',
    icon: 'storefront',
    status: 'Listo para retirar',
    detail: 'Sala Loté — Lavalle 980, CABA\nHorario: Lun a Vie 10:00–18:00',
  },
};

export function DeliveryConfirmationScreen({ route, navigation }) {
  const { delivery = 'envio', monto = 0, titulo = 'Tu pieza' } = route.params || {};
  const info = DELIVERY_INFO[delivery] || DELIVERY_INFO.envio;

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader
        title="Confirmación de entrega"
        subtitle="Compra registrada"
        shape="brown"
        embedded
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Surface style={styles.success}>
          <MaterialIcons name="check-circle" size={56} color={colors.teal} />
          <Text style={styles.successTitle}>¡Compra finalizada!</Text>
          <Text style={styles.successSubtitle}>{titulo}</Text>
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Método seleccionado</Text>
          <ListTile
            title={info.title}
            subtitle={info.status}
            icon={info.icon}
            iconColor={colors.teal}
          />
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Estado de entrega</Text>
          <View style={styles.statusRow}>
            <MaterialIcons name="schedule" size={20} color={colors.ochre} />
            <Text style={styles.statusText}>{info.status}</Text>
          </View>
          <Text style={styles.detailText}>{info.detail}</Text>
        </Surface>

        <Surface>
          <Text style={styles.sectionTitle}>Resumen del pago</Text>
          <SummaryRow label="Total abonado" value={formatCurrency(monto)} isTotal />
        </Surface>

        <Button
          title="Volver al inicio"
          onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
        />
        <Button
          title="Ver mis pujas"
          variant="outline"
          onPress={() => navigation.navigate('Tabs', { screen: 'Activities' })}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  success: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  successTitle: { ...typography.titleSm, color: colors.brown, textAlign: 'center' },
  successSubtitle: { ...typography.body, textAlign: 'center' },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.brown,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusText: { ...typography.bodyBold, color: colors.ochre },
  detailText: { ...typography.body, lineHeight: 22, color: colors.text },
});
