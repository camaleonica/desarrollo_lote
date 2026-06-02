import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export function Surface({ children, style, elevated = true }) {
  return <View style={[styles.base, elevated && styles.elevated, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  elevated: {
    shadowColor: colors.brown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
