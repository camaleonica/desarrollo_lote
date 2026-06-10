import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../layout/ScreenHeader';
import { ScreenLayout } from '../layout/ScreenLayout';
import { Surface } from '../m3/Surface';
import { Button } from '../ui/Button';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

export function GuestGate({ title, subtitle, message, children }) {
  const navigation = useNavigation();
  const { isGuest, openAuthEntry } = useAuth();

  if (!isGuest) return children;

  return (
    <ScreenLayout shape="lightBlue" safe>
      <ScreenHeader title={title} subtitle={subtitle} shape="brown" embedded />
      <View style={styles.content}>
        <Surface style={styles.card}>
          <MaterialIcons name="lock-outline" size={40} color={colors.brown} />
          <Text style={styles.title}>Necesitás una cuenta</Text>
          <Text style={styles.message}>{message}</Text>
          <Button title="Iniciar sesión" onPress={() => openAuthEntry('Login')} />
          <Button
            title="Registrarme"
            variant="outline"
            onPress={() => openAuthEntry('RegisterStep1')}
            style={styles.secondary}
          />
          <Button title="Seguir explorando subastas" variant="outline" onPress={() => navigation.navigate('Home')} />
        </Surface>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  card: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  title: { ...typography.titleSm, textAlign: 'center' },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  secondary: { marginTop: -spacing.xs },
});
