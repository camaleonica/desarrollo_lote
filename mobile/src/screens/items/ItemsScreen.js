import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/Button';
import { ListTile } from '../../components/m3/ListTile';
import { Surface } from '../../components/m3/Surface';
import { colors, spacing, typography } from '../../theme';
import { fetchMyItems } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useDialog } from '../../context/DialogContext';

const statusIcons = {
  pendiente: 'hourglass-empty',
  aceptado: 'check-circle',
  rechazado: 'cancel',
  revision: 'rate-review',
};

export function ItemsScreen({ navigation }) {
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
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

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
          <ListTile
            title={item.titulo}
            subtitle={`${item.categoria} · Estado: ${item.estado}`}
            icon={statusIcons[item.estado] || 'inventory-2'}
            iconColor={colors.teal}
          />
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { padding: spacing.lg },
  emptyCard: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  empty: { ...typography.captionMd, textAlign: 'center' },
});
