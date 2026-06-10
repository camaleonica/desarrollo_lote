import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { StatCard } from '../../components/m3/StatCard';
import { ListTile } from '../../components/m3/ListTile';
import { Surface } from '../../components/m3/Surface';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/ui/Button';
import { fetchActivities, fetchStats } from '../../services/loteApi';
import { formatCurrency } from '../../utils/validation';
import { ApiError } from '../../services/api';
import { GuestGate } from '../../components/auth/GuestGate';
import { useDialog } from '../../context/DialogContext';
import { useAuth } from '../../context/AuthContext';

const statusLabels = {
  ganando: { text: 'Ganando', icon: 'trending-up', color: colors.teal },
  superada: { text: 'Superada', icon: 'trending-down', color: colors.error },
  ganada: { text: 'Ganada', icon: 'emoji-events', color: colors.success },
  perdida: { text: 'Perdida', icon: 'remove-circle-outline', color: colors.textMuted },
};

export function ActivitiesScreen({ navigation }) {
  const { isGuest } = useAuth();
  const { showDialog } = useDialog();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [activities, statistics] = await Promise.all([fetchActivities(), fetchStats()]);
      setItems(activities);
      setStats(statistics);
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudieron cargar tus actividades',
        variant: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!isGuest) load();
  }, [isGuest]);

  if (isGuest) {
    return (
      <GuestGate
        title="Mis pujas"
        subtitle="Seguimiento de subastas"
        message="Para ver tus pujas, estadísticas y multas necesitás una cuenta verificada como postor."
      />
    );
  }

  if (loading) {
    return (
      <ScreenLayout shape="lightBlue" safe contentStyle={styles.center}>
        <ActivityIndicator color={colors.brown} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout shape="lightBlue" safe>
      <ScreenHeader title="Mis pujas" subtitle="Seguimiento de subastas" shape="ochre" embedded />
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListHeaderComponent={
          stats ? (
            <View>
              <View style={styles.statsGrid}>
                <StatCard icon="event" label="Asistidas" value={String(stats.subastas_asistidas || 0)} color={colors.brown} />
                <StatCard icon="emoji-events" label="Ganadas" value={String(stats.ganadas || 0)} color={colors.teal} />
                <StatCard icon="payments" label="Total ofertado" value={formatCurrency(stats.total_ofertado || 0)} color={colors.ochre} />
                <StatCard icon="paid" label="Total pagado" value={formatCurrency(stats.total_pagado || 0)} color={colors.teal} />
              </View>
              <Button title="Ver multas pendientes" variant="outline" onPress={() => navigation.navigate('Fines')} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Surface style={styles.emptyCard}>
            <MaterialIcons name="history" size={32} color={colors.textMuted} />
            <Text style={styles.empty}>Todavía no participaste en subastas</Text>
          </Surface>
        }
        renderItem={({ item }) => {
          const status = statusLabels[item.estado_puja] || statusLabels.superada;
          return (
            <ListTile
              title={item.titulo}
              subtitle={`${status.text} · Mi puja: ${formatCurrency(item.mi_puja || 0)} · Actual: ${formatCurrency(item.precio_actual)}`}
              icon={status.icon}
              iconColor={status.color}
            />
          );
        }}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyCard: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  empty: { ...typography.captionMd, textAlign: 'center' },
});
