import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

export function ListTile({
  title,
  subtitle,
  icon,
  iconColor = colors.brown,
  trailing,
  onPress,
  style,
}) {
  const content = (
    <>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
          <MaterialIcons name={icon} size={22} color={iconColor} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? (
        <MaterialIcons name={trailing} size={22} color={colors.textMuted} />
      ) : onPress ? (
        <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [styles.tile, pressed && styles.pressed, style]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.tile, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.brown,
  },
  subtitle: {
    ...typography.captionMd,
    marginTop: 2,
  },
});
