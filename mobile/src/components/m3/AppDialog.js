import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

const VARIANTS = {
  success: { icon: 'check-circle', color: colors.teal, bg: `${colors.teal}18` },
  error: { icon: 'error-outline', color: colors.error, bg: `${colors.error}14` },
  info: { icon: 'info-outline', color: colors.brown, bg: `${colors.lavender}66` },
  warning: { icon: 'live-tv', color: colors.ochre, bg: `${colors.ochre}18` },
};

export function AppDialog({ visible, title, message, variant = 'info', buttons = [], onDismiss }) {
  const meta = VARIANTS[variant] || VARIANTS.info;
  const actions =
    buttons.length > 0
      ? buttons
      : [{ text: 'Entendido', style: 'primary', onPress: onDismiss }];

  function handlePress(button) {
    onDismiss?.();
    button.onPress?.();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
            <MaterialIcons name={meta.icon} size={28} color={meta.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={[styles.actions, actions.length > 1 && styles.actionsRow]}>
            {actions.map((button, index) => {
              const isPrimary = button.style === 'primary' || (!button.style && index === actions.length - 1);
              const isDestructive = button.style === 'destructive';
              const isOutline = button.style === 'outline' || button.style === 'cancel';

              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  onPress={() => handlePress(button)}
                  style={[
                    styles.btn,
                    actions.length > 1 && styles.btnFlex,
                    isPrimary && styles.btnPrimary,
                    isOutline && styles.btnOutline,
                    isDestructive && styles.btnDestructive,
                  ]}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isPrimary && styles.btnTextPrimary,
                      isOutline && styles.btnTextOutline,
                      isDestructive && styles.btnTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(92, 42, 32, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.lavender,
    shadowColor: colors.brown,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleSm,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  btn: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnFlex: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: colors.brown,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.brown,
  },
  btnDestructive: {
    backgroundColor: colors.error,
  },
  btnText: {
    ...typography.button,
    fontSize: 15,
  },
  btnTextPrimary: {
    color: colors.white,
  },
  btnTextOutline: {
    color: colors.brown,
  },
  btnTextDestructive: {
    color: colors.white,
  },
});
