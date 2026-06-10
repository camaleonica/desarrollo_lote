import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Surface } from '../../components/m3/Surface';
import { ListTile } from '../../components/m3/ListTile';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme';
import { fetchFines, payFine, fetchPaymentMethods } from '../../services/loteApi';
import { formatCurrency } from '../../utils/validation';
import { ApiError } from '../../services/api';
import { useDialog } from '../../context/DialogContext';

export function FinesScreen() {
  const navigation = useNavigation();
  const { showDialog } = useDialog();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState(null);

  async function load() {
    try {
      setFines(await fetchFines());
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudieron cargar las multas',
        variant: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePay(fine) {
    setPayingId(fine.id);
    try {
      const methods = await fetchPaymentMethods();
      const defaultMethod = methods[0];
      if (!defaultMethod) {
        showDialog({
          title: 'Medio de pago requerido',
          message: 'Registrá un medio de pago para abonar la multa.',
          variant: 'warning',
          buttons: [{ text: 'Ir a medios', onPress: () => navigation.navigate('PaymentMethods') }],
        });
        return;
      }
      await payFine(fine.id, defaultMethod.id);
      showDialog({ title: 'Multa pagada', message: 'Ya podés volver a participar en subastas.', variant: 'success' });
      load();
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudo pagar la multa',
        variant: 'error',
      });
    } finally {
      setPayingId(null);
    }
  }

  if (loading) {
    return (
      <ScreenLayout shape="lavender" safe contentStyle={styles.center}>
        <ActivityIndicator color={colors.brown} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader title="Estado de cuenta" subtitle="Multas pendientes" shape="ochre" onBack={() => navigation.goBack()} embedded />
      <FlatList
        contentContainerStyle={styles.list}
        data={fines.filter((f) => !f.pagada)}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <Surface style={styles.empty}>
            <MaterialIcons name="verified" size={40} color={colors.teal} />
            <Text style={styles.emptyText}>No tenés multas pendientes</Text>
          </Surface>
        }
        renderItem={({ item }) => (
          <Surface style={styles.card}>
            <ListTile
              title={formatCurrency(item.monto)}
              subtitle={`${item.descripcion}\nVence: ${item.fecha_limite}`}
              icon="warning"
              iconColor={colors.error}
            />
            <Button title="Pagar multa" onPress={() => handlePay(item)} loading={payingId === item.id} />
          </Surface>
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg },
  empty: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  emptyText: { ...typography.body, textAlign: 'center' },
  card: { marginBottom: spacing.md, gap: spacing.sm },
});
