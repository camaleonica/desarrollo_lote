import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DialogProvider } from './src/context/DialogContext';
import { AuthStack, AppStack } from './src/navigation/stacks';
import { SplashScreen } from './src/screens/auth/SplashScreen';
import { colors, typography, useAppFonts } from './src/theme';

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brown} />
      </View>
    );
  }

  return user ? <AppStack /> : <AuthStack />;
}

function AppGate() {
  const { loaded, error } = useAppFonts();
  const [splashDone, setSplashDone] = useState(false);

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brown} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={typography.body}>No se pudieron cargar las fuentes.</Text>
      </View>
    );
  }

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <DialogProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </DialogProvider>
  );
}

export default function App() {
  return <AppGate />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
