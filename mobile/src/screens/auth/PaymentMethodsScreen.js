import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { KycStatusBanner } from '../../components/auth/KycStatusBanner';
import { useProfileSync } from '../../hooks/useProfileSync';
import { colors, spacing, typography } from '../../theme';
import {
  fetchPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';

export function PaymentMethodsScreen({ navigation, route }) {
  const { pendingPaymentSetup, completeRegistration, user, setUser } = useAuth();
  const fromRegistration = Boolean(pendingPaymentSetup || route.params?.fromRegistration);
  const { showDialog } = useDialog();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const defaultId = user?.medio_pago_default_id;

  useProfileSync();

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

  async function ensureDefaultIfNeeded(list) {
    if (defaultId || !list.length) return user;
    const preferred = list.find((m) => m.estado === 'activo') || list[0];
    if (!preferred) return user;
    const updated = await setDefaultPaymentMethod(preferred.id);
    setUser(updated);
    return updated;
  }

  async function handleSetDefault(id) {
    setSettingDefaultId(id);
    try {
      const updated = await setDefaultPaymentMethod(id);
      setUser(updated);
      showDialog({
        title: 'Listo',
        message: 'Medio de pago predeterminado actualizado.',
        variant: 'success',
      });
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudo actualizar',
        variant: 'error',
      });
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function handleDelete(id) {
    if (methods.length <= 1) {
      showDialog({
        title: 'Medio requerido',
        message: 'Debés mantener al menos un medio de pago registrado.',
        variant: 'warning',
      });
      return;
    }

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
              const latest = await fetchPaymentMethods();
              setMethods(latest);
              if (defaultId === id && latest.length) {
                const updated = await setDefaultPaymentMethod(latest[0].id);
                setUser(updated);
              }
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

      await ensureDefaultIfNeeded(latestMethods);

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
        <KycStatusBanner compact />
        <Text style={styles.hint}>
          Marcá un medio como predeterminado para pujar. Los cheques certificados requieren verificación presencial.
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.brown} style={styles.loader} />
        ) : (
          <FlatList
            data={methods}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={<Text style={styles.empty}>Todavía no agregaste medios de pago</Text>}
            renderItem={({ item }) => {
              const isDefault = Number(item.id) === Number(defaultId);
              return (
                <View style={[styles.card, isDefault && styles.cardDefault]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardTitle}>{item.label || item.tipo}</Text>
                      {isDefault ? (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Predeterminado</Text>
                        </View>
                      ) : null}
                    </View>
                    <Pressable onPress={() => handleDelete(item.id)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                    </Pressable>
                  </View>
                  <Text style={styles.cardMeta}>Tipo: {item.tipo}</Text>
                  <Text style={styles.cardMeta}>Moneda: {item.moneda}</Text>
                  <Text style={styles.cardMeta}>Estado: {item.estado}</Text>
                  {!isDefault ? (
                    <Pressable
                      style={styles.defaultBtn}
                      onPress={() => handleSetDefault(item.id)}
                      disabled={settingDefaultId === item.id}
                    >
                      {settingDefaultId === item.id ? (
                        <ActivityIndicator size="small" color={colors.teal} />
                      ) : (
                        <Text style={styles.defaultBtnText}>Usar como predeterminado</Text>
                      )}
                    </Pressable>
                  ) : null}
                </View>
              );
            }}
          />
        )}
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
  hint: { ...typography.captionMd, lineHeight: 19, marginBottom: spacing.xs },
  loader: { marginVertical: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDefault: { borderColor: colors.teal, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleWrap: { flex: 1, gap: spacing.xs },
  cardTitle: { ...typography.bodyBold, color: colors.brown },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: { ...typography.caption, fontSize: 10, color: colors.white },
  cardMeta: { ...typography.captionMd, marginTop: 4 },
  defaultBtn: { marginTop: spacing.sm, paddingVertical: spacing.xs },
  defaultBtnText: { ...typography.label, color: colors.teal },
  empty: { ...typography.captionMd, textAlign: 'center', marginVertical: spacing.lg },
});
