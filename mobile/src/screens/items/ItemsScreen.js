import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { ListTile } from '../../components/m3/ListTile';
import { Surface } from '../../components/m3/Surface';
import { colors, spacing, typography } from '../../theme';
import { fetchMyItems, respondItemConditions } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { GuestGate } from '../../components/auth/GuestGate';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';

const statusIcons = {
  pendiente: 'hourglass-empty',
  aceptado: 'check-circle',
  rechazado: 'cancel',
  revision: 'rate-review',
};

export function ItemsScreen({ navigation }) {
  const { isGuest } = useAuth();
  const { showDialog } = useDialog();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      setItems(await fetchMyItems());
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudieron cargar tus artículos',
        variant: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isGuest) return undefined;
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, isGuest]);

  if (isGuest) {
    return (
      <GuestGate
        title="Mis artículos"
        subtitle="Estado de tus solicitudes"
        message="Para solicitar artículos y seguir su revisión por la empresa necesitás registrarte."
      />
    );
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader title="Mis artículos" subtitle="Estado de tus solicitudes" shape="brown" embedded />
      <View style={styles.headerRow}>
        <Button title="Nueva solicitud" onPress={() => navigation.navigate('NewItem')} />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <Surface style={styles.emptyCard}>
            <MaterialIcons name="inventory-2" size={32} color={colors.textMuted} />
            <Text style={styles.empty}>No enviaste artículos todavía</Text>
          </Surface>
        }
        renderItem={({ item }) => (
          <Surface style={styles.itemCard}>
            <ListTile
              title={item.titulo}
              subtitle={`Estado: ${item.estado}${item.subasta ? ` · Subasta: ${item.subasta.nombre}` : ''}`}
              icon={statusIcons[item.estado] || 'inventory-2'}
              iconColor={colors.teal}
            />
            {item.deposito_ubicacion ? (
              <Text style={styles.meta}>Depósito: {item.deposito_ubicacion}</Text>
            ) : null}
            {item.seguro ? (
              <Text style={styles.meta}>Póliza: {item.seguro}</Text>
            ) : null}
            {item.estado === 'aceptado' && item.subasta ? (
              <View style={styles.actions}>
                <Button
                  title="Aceptar condiciones"
                  onPress={async () => {
                    await respondItemConditions(item.id, true);
                    load();
                  }}
                />
                <Button
                  title="Rechazar"
                  variant="outline"
                  onPress={async () => {
                    await respondItemConditions(item.id, false);
                    load();
                  }}
                />
              </View>
            ) : null}
          </Surface>
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { padding: spacing.lg },
  itemCard: { marginBottom: spacing.md, gap: spacing.sm },
  meta: { ...typography.captionMd, paddingHorizontal: spacing.sm },
  actions: { gap: spacing.sm, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  emptyCard: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  empty: { ...typography.captionMd, textAlign: 'center' },
});
