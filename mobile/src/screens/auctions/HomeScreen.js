import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { AuctionCard } from '../../components/AuctionCard';
import { SearchBar } from '../../components/m3/SearchBar';
import { FilterChip } from '../../components/m3/FilterChip';
import { Surface } from '../../components/m3/Surface';
import { colors, spacing, typography } from '../../theme';
import { fetchAuctions, fetchCategories } from '../../services/loteApi';
import { ApiError } from '../../services/api';

export function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { showDialog } = useDialog();
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const [list, cats] = await Promise.all([fetchAuctions(), fetchCategories()]);
      setAuctions(list);
      setCategories(['Todas', ...cats]);
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudieron cargar las subastas',
        variant: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = auctions.filter((item) => {
    const matchCategory = selectedCategory === 'Todas' || item.categoria === selectedCategory;
    const matchSearch = item.titulo.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (loading) {
    return (
      <ScreenLayout shape="lightBlue" safe contentStyle={styles.center}>
        <ActivityIndicator color={colors.brown} size="large" />
      </ScreenLayout>
    );
  }

  const userName = user ? `${user.nombre} ${user.apellido}` : 'Invitado';

  return (
    <ScreenLayout shape="lightBlue" safe>
      <ScreenHeader title="Subastas" subtitle="Explorá piezas en vivo" shape="brown" embedded />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Surface style={styles.userCard}>
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <MaterialIcons name="account-circle" size={36} color={colors.brown} />
                </View>
                <View style={styles.userText}>
                  <Text style={styles.userGreeting}>Hola, {userName}</Text>
                  <Text style={styles.userMeta}>
                    Categoría: {selectedCategory === 'Todas' ? 'General' : selectedCategory}
                  </Text>
                </View>
                <MaterialIcons name="notifications-none" size={24} color={colors.textMuted} />
              </View>
            </Surface>

            <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar subasta..." />

            <Text style={styles.sectionLabel}>Categorías</Text>
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              style={styles.chipsList}
              contentContainerStyle={styles.chipsContent}
              renderItem={({ item }) => (
                <FilterChip
                  label={item}
                  selected={selectedCategory === item}
                  onPress={() => setSelectedCategory(item)}
                />
              )}
            />

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Subastas activas</Text>
              <Text style={styles.sectionCount}>{filtered.length}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <AuctionCard auction={item} onPress={() => navigation.navigate('AuctionDetail', { id: item.id })} />
        )}
        ListEmptyComponent={
          <Surface style={styles.emptyCard}>
            <MaterialIcons name="inventory-2" size={32} color={colors.textMuted} />
            <Text style={styles.empty}>No hay subastas para mostrar</Text>
          </Surface>
        }
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  headerBlock: { gap: spacing.md, marginBottom: spacing.sm },
  userCard: { paddingVertical: spacing.sm },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { marginRight: spacing.sm },
  userText: { flex: 1 },
  userGreeting: { ...typography.bodyBold, color: colors.brown },
  userMeta: { ...typography.captionMd, marginTop: 2 },
  sectionLabel: { ...typography.captionMd, color: colors.textMuted },
  chipsList: { flexGrow: 0 },
  chipsContent: { paddingVertical: spacing.xs, alignItems: 'center' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitle: { ...typography.titleSm, fontSize: 18 },
  sectionCount: { ...typography.label, color: colors.teal },
  emptyCard: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  empty: { ...typography.captionMd, textAlign: 'center' },
});
