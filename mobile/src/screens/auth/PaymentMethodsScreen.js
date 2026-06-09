import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme';
import { fetchPaymentMethods, deletePaymentMethod } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';

export function PaymentMethodsScreen({ navigation, route }) {
  const { pendingPaymentSetup, completeRegistration } = useAuth();
  const fromRegistration = Boolean(pendingPaymentSetup || route.params?.fromRegistration);
  const { showDialog } = useDialog();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);

  async function load() {
    try {
      setMethods(await fetchPaymentMethods());
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudieron cargar los medios de pago',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLoading(true);
      load();
    });
    return unsubscribe;
  }, [navigation]);

  async function handleDelete(id) {
    showDialog({
      title: 'Eliminar medio',
      message: '¿Querés eliminar este medio de pago?',
      variant: 'warning',
      buttons: [
        { text: 'Cancelar', style: 'outline' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePaymentMethod(id);
              await load();
            } catch (error) {
              showDialog({
                title: 'Error',
                message: error instanceof ApiError ? error.message : 'No se pudo eliminar',
                variant: 'error',
              });
            }
          },
        },
      ],
    });
  }

  async function handleContinue() {
    setContinuing(true);
    try {
      const latestMethods = await fetchPaymentMethods();
      setMethods(latestMethods);

      if (latestMethods.length === 0) {
        showDialog({
          title: 'Medio de pago requerido',
          message: 'Agregá al menos un medio de pago para continuar.',
          variant: 'info',
        });
        return;
      }

      if (fromRegistration) {
        await completeRegistration();
        return;
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }

      showDialog({
        title: 'Listo',
        message: 'Tus medios de pago quedaron guardados.',
        variant: 'success',
      });
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudo continuar',
        variant: 'error',
      });
    } finally {
      setContinuing(false);
    }
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader
        title="Medios de pago"
        subtitle={fromRegistration ? 'Paso final del registro' : 'Administrá tus métodos'}
        shape="brown"
        onBack={fromRegistration ? undefined : () => navigation.goBack()}
        embedded
      />
      <View style={styles.content}>
        <FlatList
          data={methods}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>Todavía no agregaste medios de pago</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.label || item.tipo}</Text>
                <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                  <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                </Pressable>
              </View>
              <Text style={styles.cardMeta}>Tipo: {item.tipo}</Text>
              <Text style={styles.cardMeta}>Moneda: {item.moneda}</Text>
              <Text style={styles.cardMeta}>Estado: {item.estado}</Text>
            </View>
          )}
        />
        <Button
          title="Agregar medio de pago"
          onPress={() =>
            navigation.navigate('AddPayment', fromRegistration ? { fromRegistration: true } : undefined)
          }
        />
        <Button
          title={fromRegistration ? 'Continuar al inicio' : 'Continuar'}
          variant="outline"
          onPress={handleContinue}
          loading={continuing}
          disabled={continuing}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg, gap: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...typography.bodyBold, color: colors.brown, flex: 1 },
  cardMeta: { ...typography.captionMd, marginTop: 4 },
  empty: { ...typography.captionMd, textAlign: 'center', marginVertical: spacing.lg },
});
