import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { ListTile } from '../../components/m3/ListTile';
import { Surface } from '../../components/m3/Surface';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { disconnectSocket } from '../../services/auctionSocket';
import { updateProfile, uploadAvatar, resolveMediaUrl } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { KycStatusBanner } from '../../components/auth/KycStatusBanner';
import { PaymentDefaultBanner } from '../../components/auth/PaymentDefaultBanner';
import { useProfileSync } from '../../hooks/useProfileSync';

function GuestProfile() {
  const { openAuthEntry } = useAuth();

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader title="Perfil" subtitle="Modo invitado" shape="teal" embedded />
      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.profileCard}>
          <MaterialIcons name="visibility" size={72} color={colors.brown} />
          <Text style={styles.name}>Invitado</Text>
          <Text style={styles.email}>Explorá subastas sin participar</Text>
        </Surface>
        <Button title="Iniciar sesión" onPress={() => openAuthEntry('Login')} />
        <Button title="Registrarme" variant="outline" onPress={() => openAuthEntry('RegisterStep1')} style={styles.gap} />
      </ScrollView>
    </ScreenLayout>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation();
  const { user, setUser, isGuest, signOut } = useAuth();
  const { showDialog } = useDialog();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [togglingNotif, setTogglingNotif] = useState(false);

  useProfileSync();

  if (isGuest) {
    return <GuestProfile />;
  }

  const avatarUri = resolveMediaUrl(user?.foto_perfil);

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showDialog({ title: 'Permiso requerido', message: 'Necesitamos acceso a tus fotos.', variant: 'warning' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingPhoto(true);
    try {
      const updated = await uploadAvatar(result.assets[0]);
      setUser(updated);
      showDialog({ title: 'Listo', message: 'Tu foto de perfil se actualizó.', variant: 'success' });
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudo subir la foto',
        variant: 'error',
      });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleToggleNotifications() {
    setTogglingNotif(true);
    try {
      const updated = await updateProfile({ notificaciones: !user?.notificaciones });
      setUser(updated);
      showDialog({
        title: 'Notificaciones',
        message: updated.notificaciones
          ? 'Activaste las notificaciones de la app.'
          : 'Desactivaste las notificaciones de la app.',
        variant: 'success',
      });
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudo actualizar',
        variant: 'error',
      });
    } finally {
      setTogglingNotif(false);
    }
  }

  function handleLogout() {
    showDialog({
      title: 'Cerrar sesión',
      message: '¿Querés salir de tu cuenta?',
      variant: 'info',
      buttons: [
        { text: 'Cancelar', style: 'outline' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            disconnectSocket();
            await signOut();
          },
        },
      ],
    });
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader title="Perfil" subtitle="Tu cuenta en Loté" shape="teal" embedded />
      <ScrollView contentContainerStyle={styles.content}>
        <KycStatusBanner compact />
        <PaymentDefaultBanner compact />
        <Surface style={styles.profileCard}>
          <Pressable onPress={handlePickAvatar} style={styles.avatarWrap} disabled={uploadingPhoto}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <MaterialIcons name="account-circle" size={88} color={colors.brown} />
            )}
            <View style={styles.avatarBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <MaterialIcons name="photo-camera" size={16} color={colors.white} />
              )}
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Tocá para cambiar tu foto</Text>
          <Text style={styles.name}>{user?.nombre} {user?.apellido}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.meta}>Categoría: {user?.categoria || 'común'}</Text>
          <Text style={styles.meta}>
            Verificación:{' '}
            {user?.kyc_status === 'approved'
              ? 'Aprobada'
              : user?.kyc_status === 'submitted'
                ? 'En revisión'
                : 'Pendiente'}
          </Text>
        </Surface>

        <ListTile
          title="Medios de pago"
          subtitle="Gestioná tus formas de pago"
          icon="credit-card"
          onPress={() => navigation.navigate('PaymentMethods')}
        />
        <ListTile
          title="Multas"
          subtitle="Estado de cuenta"
          icon="warning"
          onPress={() => navigation.navigate('Fines')}
        />
        <ListTile
          title="Notificaciones"
          subtitle={
            togglingNotif
              ? 'Actualizando…'
              : (user?.notificaciones ? 'Activadas — tocá para desactivar' : 'Desactivadas — tocá para activar')
          }
          icon="notifications-none"
          onPress={handleToggleNotifications}
        />

        <Button title="Cerrar sesión" variant="outline" onPress={handleLogout} style={styles.logout} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  profileCard: { alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.lg, gap: spacing.xs },
  avatarWrap: { position: 'relative', marginBottom: spacing.xs },
  avatarImage: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.lavender },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarHint: { ...typography.captionMd, color: colors.textMuted, marginBottom: spacing.xs },
  name: { ...typography.titleSm, marginTop: spacing.sm },
  email: { ...typography.captionMd },
  meta: { ...typography.captionMd, color: colors.teal, textAlign: 'center', marginTop: spacing.sm },
  logout: { marginTop: spacing.lg },
  gap: { marginTop: spacing.sm },
});
