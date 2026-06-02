import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export function SummaryRow({ label, value, highlight = false, isTotal = false }) {
  return (
    <View style={[styles.row, isTotal && styles.totalRow]}>
      <Text style={[styles.label, isTotal && styles.totalLabel]}>{label}</Text>
      <Text style={[styles.value, highlight && styles.highlight, isTotal && styles.totalValue]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  label: { ...typography.body, color: colors.textMuted },
  totalLabel: { ...typography.bodyBold, color: colors.brown },
  value: { ...typography.body, color: colors.text },
  highlight: { color: colors.ochre },
  totalValue: { ...typography.price, fontSize: 22 },
});
