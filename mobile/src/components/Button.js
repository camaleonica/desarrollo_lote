import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';
  const isAccent = variant === 'accent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        isSecondary && styles.secondary,
        isAccent && styles.accent,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.brown : colors.white} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary && styles.textPrimary,
            isOutline && styles.textOutline,
            isSecondary && styles.textSecondary,
            isAccent && styles.textPrimary,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    backgroundColor: colors.brown,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.brown,
  },
  secondary: {
    backgroundColor: colors.ochre,
  },
  accent: {
    backgroundColor: colors.teal,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    ...typography.button,
  },
  textPrimary: {
    color: colors.white,
  },
  textOutline: {
    color: colors.brown,
  },
  textSecondary: {
    color: colors.white,
  },
});
