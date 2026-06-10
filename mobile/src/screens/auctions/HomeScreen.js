import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { AuctionCard } from '../../components/auction/AuctionCard';
import { SearchBar } from '../../components/m3/SearchBar';
import { FilterChip } from '../../components/m3/FilterChip';
import { Surface } from '../../components/m3/Surface';
import { colors, spacing, typography } from '../../theme';
import { fetchAuctions, fetchCategories, resolveMediaUrl } from '../../services/loteApi';
import { GuestBanner } from '../../components/auth/GuestBanner';
import { ApiError } from '../../services/api';

const MEMBERSHIP_LABELS = {
  comun: 'Común',
  especial: 'Especial',
  plata: 'Plata',
  oro: 'Oro',
  platino: 'Platino',
};

function SectionHeader({ title, count }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

export function HomeScreen({ navigation }) {
  const { user, isGuest } = useAuth();
  const { showDialog } = useDialog();
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const [list, cats] = await Promise.all([
        fetchAuctions({ auth: !isGuest }),
        fetchCategories(),
      ]);
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
  }, [isGuest]);

  const filtered = useMemo(() => auctions.filter((item) => {
    const matchCategory = selectedCategory === 'Todas' || item.categoria === selectedCategory;
    const matchSearch = item.titulo.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  }), [auctions, selectedCategory, search]);

  const { disponibles, bloqueadas } = useMemo(() => {
    if (isGuest) {
      return { disponibles: filtered, bloqueadas: [] };
    }
    return {
      disponibles: filtered.filter((item) => !item.bloqueada),
      bloqueadas: filtered.filter((item) => item.bloqueada),
    };
  }, [filtered, isGuest]);

  const listData = useMemo(() => {
    const rows = [];
    if (disponibles.length) {
      rows.push({ type: 'header', key: 'h-ok', title: isGuest ? 'Subastas para explorar' : 'Podés participar', count: disponibles.length });
      disponibles.forEach((item) => rows.push({ type: 'auction', key: `a-${item.id}`, item, locked: isGuest }));
    }
    if (bloqueadas.length) {
      rows.push({ type: 'header', key: 'h-lock', title: 'Requieren categoría mayor', count: bloqueadas.length });
      bloqueadas.forEach((item) => rows.push({ type: 'auction', key: `l-${item.id}`, item, locked: true }));
    }
    return rows;
  }, [disponibles, bloqueadas, isGuest]);

  if (loading) {
    return (
      <ScreenLayout shape="lightBlue" safe contentStyle={styles.center}>
        <ActivityIndicator color={colors.brown} size="large" />
      </ScreenLayout>
    );
  }

  const userName = user ? `${user.nombre} ${user.apellido}` : 'Invitado';
  const membership = MEMBERSHIP_LABELS[user?.categoria] || user?.categoria || 'Sin membresía';
  const avatarUri = resolveMediaUrl(user?.foto_perfil);

  return (
    <ScreenLayout shape="lightBlue" safe>
      <ScreenHeader title="Subastas" subtitle="Explorá piezas en vivo" shape="brown" embedded />
      <FlatList
        data={listData}
        keyExtractor={(row) => row.key}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <GuestBanner />
            <Surface style={styles.userCard}>
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <MaterialIcons name="account-circle" size={36} color={colors.brown} />
                  )}
                </View>
                <View style={styles.userText}>
                  <Text style={styles.userGreeting}>Hola, {userName}</Text>
                  <Text style={styles.userMeta}>
                    Tu membresía: {membership}
                  </Text>
                </View>
                <MaterialIcons name="notifications-none" size={24} color={colors.textMuted} />
              </View>
            </Surface>

            <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar subasta..." />

            <Text style={styles.sectionLabel}>Filtrar por tipo de subasta</Text>
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
          </View>
        }
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            return <SectionHeader title={row.title} count={row.count} />;
          }
          return (
            <AuctionCard
              auction={row.item}
              locked={row.locked}
              onPress={() => navigation.getParent()?.navigate('AuctionCatalog', { id: row.item.id })}
            />
          );
        }}
        ListEmptyComponent={
          <Surface style={styles.emptyCard}>
            <MaterialIcons name="inventory-2" size={32} color={colors.textMuted} />
            <Text style={styles.empty}>No hay subastas con ese filtro</Text>
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
  avatarImage: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lavender },
  userText: { flex: 1 },
  userGreeting: { ...typography.bodyBold, color: colors.brown },
  userMeta: { ...typography.captionMd, marginTop: 2, color: colors.teal },
  sectionLabel: { ...typography.captionMd, color: colors.textMuted },
  chipsList: { flexGrow: 0 },
  chipsContent: { paddingVertical: spacing.xs, alignItems: 'center' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.titleSm, fontSize: 18 },
  sectionCount: { ...typography.label, color: colors.teal },
  emptyCard: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  empty: { ...typography.captionMd, textAlign: 'center' },
});
