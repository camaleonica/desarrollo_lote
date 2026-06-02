import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

export function OptionCard({ title, subtitle, icon, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <MaterialIcons name={icon} size={24} color={selected ? colors.white : colors.brown} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, selected && styles.subtitleSelected]}>{subtitle}</Text>
        ) : null}
      </View>
      <MaterialIcons
        name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
        size={22}
        color={selected ? colors.teal : colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.teal,
    backgroundColor: `${colors.lightBlue}88`,
  },
  pressed: { opacity: 0.9 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWrapSelected: {
    backgroundColor: colors.teal,
  },
  textWrap: { flex: 1 },
  title: { ...typography.bodyBold, color: colors.brown },
  titleSelected: { color: colors.brown },
  subtitle: { ...typography.captionMd, marginTop: 2 },
  subtitleSelected: { color: colors.text },
});
