import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export function GuestBanner({ compact = false }) {
  const { isGuest, openAuthEntry } = useAuth();
  if (!isGuest) return null;

  return (
    <Pressable style={[styles.banner, compact && styles.compact]} onPress={() => openAuthEntry('RegisterStep1')}>
      <MaterialIcons name="info-outline" size={20} color={colors.brown} />
      <Text style={styles.text}>
        Estás en modo invitado. Podés ver subastas y catálogos, pero no participar.
      </Text>
      <Text style={styles.link}>Registrate</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.lightBlue,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lavender,
  },
  compact: { marginBottom: spacing.sm },
  text: { ...typography.captionMd, flex: 1, color: colors.textPrimary },
  link: { ...typography.label, color: colors.teal },
});
