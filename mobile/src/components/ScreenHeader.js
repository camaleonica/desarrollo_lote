import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { spacing, typography } from '../theme';
import { BackIcon } from './SvgAsset';
import { ShapeSetIcon } from './ShapeSetIcon';

export function ScreenHeader({ title, subtitle, onBack, shape = 'brown', embedded = false }) {
  return (
    <View style={styles.wrapper}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <BackIcon size={22} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.header}>
        <View style={styles.shapeWrap}>
          <ShapeSetIcon variant={shape} size={72} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: spacing.lg,
    top: spacing.md,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  shapeWrap: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    fontSize: 14,
    textAlign: 'center',
    color: typography.body.color,
  },
});
