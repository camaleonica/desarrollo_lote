import { View, StyleSheet } from 'react-native';
import { HammerIcon } from './HammerIcon';
import { AppText } from './AppText';
import { spacing, typography } from '../theme';

export function Logo({ size = 'large', showIcon = true, iconVariant = 'card' }) {
  const isLarge = size === 'large';
  const iconSize = isLarge ? { width: 200, height: 186 } : { width: 120, height: 111 };

  return (
    <View style={styles.container}>
      {showIcon ? <HammerIcon {...iconSize} variant={iconVariant} /> : null}
      <AppText style={[isLarge ? typography.brandLG : typography.brandMD, styles.brand]}>
        Loté.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  brand: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
