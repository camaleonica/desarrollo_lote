import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/Button';
import { ListTile } from '../../components/m3/ListTile';
import { Surface } from '../../components/m3/Surface';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';

export function ProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { showDialog } = useDialog();

  function handleLogout() {
    showDialog({
      title: 'Cerrar sesión',
      message: '¿Querés salir de tu cuenta?',
      variant: 'info',
      buttons: [
        { text: 'Cancelar', style: 'outline' },
        { text: 'Salir', style: 'destructive', onPress: signOut },
      ],
    });
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader title="Perfil" subtitle="Tu cuenta en Loté" shape="teal" embedded />
      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.profileCard}>
          <MaterialIcons name="account-circle" size={72} color={colors.brown} />
          <Text style={styles.name}>
            {user?.nombre} {user?.apellido}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </Surface>

        <ListTile title="Mis datos" icon="badge" onPress={() => {}} />
        <ListTile title="Medios de pago" icon="credit-card" onPress={() => navigation.navigate('PaymentMethods')} />
        <ListTile title="Notificaciones" icon="notifications-none" onPress={() => {}} />
        <ListTile title="Seguridad" icon="lock-outline" onPress={() => {}} />

        <Button title="Cerrar sesión" variant="outline" onPress={handleLogout} style={styles.logout} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
  },
  name: { ...typography.titleSm, marginTop: spacing.sm },
  email: { ...typography.captionMd, marginTop: spacing.xs },
  logout: { marginTop: spacing.lg },
});
