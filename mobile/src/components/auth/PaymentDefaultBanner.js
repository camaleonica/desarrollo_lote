import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { isKycApproved } from './KycStatusBanner';

export function PaymentDefaultBanner({ compact = false }) {
  const navigation = useNavigation();
  const { user, isGuest } = useAuth();

  if (isGuest || !user || !isKycApproved(user) || user.medio_pago_default_id) {
    return null;
  }

  return (
    <Pressable
      style={[styles.banner, compact && styles.compact]}
      onPress={() => navigation.navigate('PaymentMethods')}
    >
      <MaterialIcons name="credit-card" size={22} color={colors.teal} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>Elegí tu forma de pago predeterminada</Text>
        <Text style={styles.text}>
          Para pujar necesitás marcar un medio de pago como predeterminado en tu perfil.
        </Text>
      </View>
      <Text style={styles.link}>Ir</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0F7F7',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  compact: { marginBottom: spacing.sm },
  textWrap: { flex: 1, gap: 4 },
  title: { ...typography.label, color: colors.teal },
  text: { ...typography.captionMd, lineHeight: 19 },
  link: { ...typography.label, color: colors.teal },
});
