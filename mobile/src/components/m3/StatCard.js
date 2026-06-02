import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

export function StatCard({ icon, label, value, color = colors.brown }) {
  return (
    <View style={styles.card}>
      <MaterialIcons name={icon} size={20} color={color} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
    gap: 4,
  },
  value: {
    ...typography.titleSm,
    fontSize: 20,
    marginTop: spacing.xs,
  },
  label: {
    ...typography.captionMd,
    fontSize: 12,
  },
});
