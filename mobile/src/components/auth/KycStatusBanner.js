import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const MESSAGES = {
  pending: {
    icon: 'assignment-late',
    title: 'Completá tu verificación',
    text: 'Enviá tus datos y fotos del DNI para poder participar en subastas.',
  },
  submitted: {
    icon: 'hourglass-top',
    title: 'Identidad en revisión',
    text: 'Un empleado está verificando tu cuenta. El proceso puede demorar hasta 24 h. Podés explorar subastas, pero no pujar hasta ser aprobado.',
  },
};

export function isKycApproved(user) {
  return user?.kyc_status === 'approved';
}

export function KycStatusBanner({ compact = false }) {
  const { user, isGuest } = useAuth();
  if (isGuest || !user || isKycApproved(user)) return null;

  const status = user.kyc_status === 'submitted' ? 'submitted' : 'pending';
  const copy = MESSAGES[status];

  return (
    <View style={[styles.banner, compact && styles.compact, status === 'submitted' && styles.bannerWarn]}>
      <MaterialIcons name={copy.icon} size={22} color={colors.brown} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.text}>{copy.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.lightBlue,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lavender,
  },
  bannerWarn: {
    backgroundColor: '#FFF8EE',
    borderColor: colors.ochre,
  },
  compact: { marginBottom: spacing.sm },
  textWrap: { flex: 1, gap: 4 },
  title: { ...typography.label, color: colors.brown },
  text: { ...typography.captionMd, lineHeight: 19 },
});
