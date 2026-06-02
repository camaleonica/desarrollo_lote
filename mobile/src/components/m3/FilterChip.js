import { Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export function FilterChip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  chipPressed: {
    opacity: 0.85,
  },
  label: {
    ...typography.label,
    fontSize: 14,
  },
  labelSelected: {
    color: colors.white,
  },
});
