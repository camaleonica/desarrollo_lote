import { useEffect } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts } from '../../theme';

const splashHand = require('../../../assets/svg/splash-hand.png');
const HAND_ASPECT = 568 / 439;

export function SplashScreen({ onFinish }) {
  const { width } = useWindowDimensions();
  const handWidth = width * 0.82;
  const handHeight = handWidth * HAND_ASPECT;

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.center}>
        <Text style={styles.brand}>Loté.</Text>
      </View>
      <Image
        source={splashHand}
        style={[styles.gavel, { width: handWidth, height: handHeight }]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'visible',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brand: {
    fontFamily: fonts.rubik80s,
    fontSize: 58,
    color: colors.text,
    textAlign: 'center',
  },
  gavel: {
    position: 'absolute',
    right: -4,
    bottom: 0,
  },
});
