import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme';
import { fetchPaymentMethods } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useDialog } from '../../context/DialogContext';

export function PaymentMethodsScreen({ navigation }) {
  const { showDialog } = useDialog();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader
        title="Medios de pago"
        subtitle="Administrá tus métodos"
        shape="brown"
        onBack={() => navigation.goBack()}
        embedded
      />
      <View style={styles.content}>
        <FlatList
          data={methods}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>Todavía no agregaste medios de pago</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.tipo}</Text>
              <Text style={styles.cardMeta}>Titular: {item.titular}</Text>
              <Text style={styles.cardMeta}>Terminada en {item.ultimos_digitos}</Text>
            </View>
          )}
        />
        <Button title="Agregar medio de pago" onPress={() => navigation.navigate('AddPayment')} />
        <Button title="Continuar" variant="outline" onPress={() => navigation.goBack()} disabled={loading} />
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
  cardTitle: { ...typography.bodyBold, color: colors.brown },
  cardMeta: { ...typography.captionMd, marginTop: 4 },
  empty: { ...typography.captionMd, textAlign: 'center', marginVertical: spacing.lg },
});
