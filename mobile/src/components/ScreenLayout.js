import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shapeColors } from '../theme';

export function ShapeBackground() {
  return null;
}

export function ScreenLayout({
  children,
  shape = 'lightBlue',
  safe = true,
  style,
  contentStyle,
}) {
  const backgroundColor = shapeColors[shape] || shapeColors.white;

  return (
    <View style={[styles.screen, { backgroundColor }, style]}>
      {safe ? (
        <SafeAreaView style={[styles.content, contentStyle]} edges={['top', 'left', 'right', 'bottom']}>
          {children}
        </SafeAreaView>
      ) : (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
