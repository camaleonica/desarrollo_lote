import { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts } from '../../theme';

const splashHand = require('../../../assets/images/splash/splash-hand.png');
const HAND_ASPECT = 568 / 439;

export function SplashScreen({ onFinish }) {
  const { width } = useWindowDimensions();
  const handWidth = width * 0.82;
  const handHeight = handWidth * HAND_ASPECT;

  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(0.88)).current;
  const handOpacity = useRef(new Animated.Value(0)).current;
  const handTranslateY = useRef(new Animated.Value(48)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(brandScale, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(handOpacity, {
        toValue: 1,
        duration: 1200,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(handTranslateY, {
        toValue: 0,
        duration: 1200,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    intro.start(({ finished }) => {
      if (finished) breathing.start();
    });

    const timer = setTimeout(() => {
      breathing.stop();
      onFinish?.();
    }, 2800);

    return () => {
      clearTimeout(timer);
      breathing.stop();
    };
  }, [onFinish, brandOpacity, brandScale, handOpacity, handTranslateY, pulse]);

  const logoScale = brandScale.interpolate({
    inputRange: [0.88, 1],
    outputRange: [0.88, 1],
  });

  const breatheScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const combinedScale = Animated.multiply(logoScale, breatheScale);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.center}>
        <Animated.View style={{ opacity: brandOpacity, transform: [{ scale: combinedScale }] }}>
          <Text style={styles.brand}>Loté.</Text>
        </Animated.View>
      </View>
      <Animated.Image
        source={splashHand}
        style={[
          styles.gavel,
          {
            width: handWidth,
            height: handHeight,
            opacity: handOpacity,
            transform: [{ translateY: handTranslateY }],
          },
        ]}
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
