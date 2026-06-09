import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { spacing, typography, colors } from '../../theme';
import { getEmailValidationError, validateRegisterStep2 } from '../../utils/validation';
import { registerProvisional, changePassword, submitKyc } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';

export function RegisterStep2Screen({ navigation }) {
  const { registerDraft, setRegisterDraft, setPendingPaymentSetup } = useAuth();
  const { showDialog } = useDialog();
  const [email, setEmail] = useState(registerDraft.email || '');
  const [provisionalPassword, setProvisionalPassword] = useState(registerDraft.provisional_password || '');
  const [provisionalInput, setProvisionalInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatingProvisional, setGeneratingProvisional] = useState(false);

  async function handleGenerateProvisional(nextEmail = email) {
    const trimmed = nextEmail.trim();
    if (!trimmed) return;
    if (getEmailValidationError(trimmed)) {
      setErrors((prev) => ({ ...prev, email: 'El email no es válido' }));
      return;
    }

    setGeneratingProvisional(true);
    try {
      const data = await registerProvisional(trimmed);
      setProvisionalPassword(data.provisionalPassword);
      setRegisterDraft((prev) => ({
        ...prev,
        email: trimmed,
        provisional_password: data.provisionalPassword,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        delete next.provisionalPassword;
        return next;
      });
      showDialog({
        title: 'Contraseña provisoria generada',
        message:
          'Te asignamos una contraseña provisoria. Reingresala abajo y creá tu contraseña definitiva para continuar.',
        variant: 'info',
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_EXISTS') {
        setErrors((prev) => ({ ...prev, email: 'Ya existe una cuenta con ese email' }));
      } else {
        showDialog({
          title: 'Error',
          message: error instanceof ApiError ? error.message : 'No se pudo generar la contraseña provisoria',
          variant: 'error',
        });
      }
    } finally {
      setGeneratingProvisional(false);
    }
  }

  function handleEmailBlur() {
    if (provisionalPassword) return;
    const trimmed = email.trim();
    if (!trimmed) return;

    if (getEmailValidationError(trimmed)) {
      setErrors((prev) => ({ ...prev, email: 'El email no es válido' }));
      return;
    }

    handleGenerateProvisional(trimmed);
  }

  async function handleRegister() {
    let activeProvisional = provisionalPassword;
    if (!activeProvisional) {
      const trimmed = email.trim();
      if (!trimmed) {
        setErrors({ email: 'El email es obligatorio' });
        return;
      }
      if (getEmailValidationError(trimmed)) {
        setErrors({ email: 'El email no es válido' });
        return;
      }

      setLoading(true);
      try {
        const data = await registerProvisional(email.trim());
        activeProvisional = data.provisionalPassword;
        setProvisionalPassword(data.provisionalPassword);
      } catch (error) {
        if (error instanceof ApiError && error.code === 'EMAIL_EXISTS') {
          setErrors({ email: 'Ya existe una cuenta con ese email' });
        } else {
          showDialog({
            title: 'Error',
            message: error instanceof ApiError ? error.message : 'No se pudo crear la cuenta',
            variant: 'error',
          });
        }
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    const fieldErrors = validateRegisterStep2({
      email,
      provisionalPassword: activeProvisional,
      provisionalInput,
      newPassword,
      confirmPassword,
    });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setLoading(true);
    try {
      await changePassword({
        currentPassword: provisionalInput,
        newPassword,
      });

      await submitKyc({
        first_name: registerDraft.nombre,
        last_name: registerDraft.apellido,
        legal_address: registerDraft.domicilio,
        country: registerDraft.pais || 'Argentina',
        dniFront: registerDraft.dni_frente,
        dniBack: registerDraft.dni_dorso,
      });

      setRegisterDraft({});
      setPendingPaymentSetup(true);
      navigation.reset({
        index: 0,
        routes: [{ name: 'PaymentMethods', params: { fromRegistration: true } }],
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setErrors({ provisionalPassword: 'La contraseña provisoria no es correcta' });
      } else if (error instanceof ApiError && error.errors) {
        const mapped = {};
        if (error.errors.new_password) mapped.newPassword = error.errors.new_password;
        if (error.errors.current_password) mapped.provisionalPassword = error.errors.current_password;
        if (Object.keys(mapped).length) setErrors(mapped);
        else showDialog({ title: 'Error', message: error.message, variant: 'error' });
      } else {
        showDialog({
          title: 'Error',
          message: error.message || 'No se pudo completar el registro',
          variant: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader title="Seguridad" subtitle="Paso 2 de 2" shape="brown" onBack={() => navigation.goBack()} embedded />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>Completá tu registro</Text>
          <Text style={styles.hint}>
            Ingresá tu email para recibir una contraseña provisoria. Luego definí tu contraseña definitiva antes de
            continuar.
          </Text>

          <Input
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errors.email) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.email;
                  return next;
                });
              }
              if (provisionalPassword) {
                setProvisionalPassword('');
                setProvisionalInput('');
                setRegisterDraft((prev) => ({ ...prev, email: value, provisional_password: undefined }));
              }
            }}
            onBlur={handleEmailBlur}
            placeholder="tu@mail.com"
            keyboardType="email-address"
            error={errors.email}
          />

          {provisionalPassword ? (
            <View style={styles.provisionalBox}>
              <Text style={styles.provisionalLabel}>Tu contraseña provisoria</Text>
              <Text style={styles.provisionalValue} selectable>
                {provisionalPassword}
              </Text>
              <Text style={styles.provisionalHint}>Guardala y reingresala en el campo de abajo.</Text>
            </View>
          ) : (
            <Button
              title="Generar contraseña provisoria"
              variant="outline"
              onPress={() => handleGenerateProvisional()}
              loading={generatingProvisional}
              disabled={!email.trim() || Boolean(getEmailValidationError(email.trim()))}
            />
          )}

          <Input
            label="Contraseña provisoria"
            value={provisionalInput}
            onChangeText={setProvisionalInput}
            placeholder="Reingresá la contraseña provisoria"
            secureTextEntry
            error={errors.provisionalPassword}
          />
          <Input
            label="Nueva contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Mín. 8 caracteres y un número"
            secureTextEntry
            error={errors.newPassword}
          />
          <Input
            label="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
          />

          <View style={styles.note}>
            <Text style={styles.noteText}>Deberás registrar un medio de pago para participar en las subastas.</Text>
          </View>

          <Button title="Guardar y continuar" onPress={handleRegister} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.sm },
  intro: { ...typography.titleSm, fontSize: 20, color: colors.brown, marginBottom: spacing.xs },
  hint: { ...typography.body, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.sm },
  provisionalBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brown,
    padding: spacing.md,
    gap: spacing.xs,
  },
  provisionalLabel: { ...typography.label, color: colors.brown },
  provisionalValue: { ...typography.titleSm, fontSize: 22, letterSpacing: 1, color: colors.text },
  provisionalHint: { ...typography.captionMd, color: colors.textMuted },
  note: {
    backgroundColor: `${colors.lightBlue}88`,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  noteText: { ...typography.captionMd, lineHeight: 20 },
});
