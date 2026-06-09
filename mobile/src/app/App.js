import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DialogProvider } from '../context/DialogContext';
import { AuthStack, AppStack } from '../navigation/stacks';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { colors, typography, useAppFonts } from '../theme';

function RootNavigator() {
  const { canAccessApp, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brown} />
      </View>
    );
  }

  return canAccessApp ? <AppStack /> : <AuthStack />;
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
        <AuthRoot />
      </AuthProvider>
    </DialogProvider>
  );
}

function AuthRoot() {
  const { canAccessApp } = useAuth();

  return (
    <NavigationContainer key={canAccessApp ? 'main-app' : 'auth-flow'}>
      <RootNavigator />
    </NavigationContainer>
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
