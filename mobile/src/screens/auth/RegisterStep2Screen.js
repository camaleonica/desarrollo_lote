import { useState } from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { spacing } from '../../theme';
import { validateRegisterStep2 } from '../../utils/validation';
import { register } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';

export function RegisterStep2Screen({ navigation }) {
  const { registerDraft, setRegisterDraft, setUser } = useAuth();
  const { showDialog } = useDialog();
  const [email, setEmail] = useState(registerDraft.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleRegister(goPayments) {
    const fieldErrors = validateRegisterStep2({ email, password, confirmPassword });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setLoading(true);
    try {
      const payload = { ...registerDraft, email, password };
      const data = await register(payload);
      setUser(data.user);
      setRegisterDraft({});
      if (goPayments) {
        navigation.navigate('PaymentMethods');
      } else {
        showDialog({
          title: 'Cuenta creada',
          message: 'Tu cuenta fue registrada correctamente.',
          variant: 'success',
        });
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_EXISTS') {
        showDialog({ title: 'Error', message: 'Ya existe una cuenta con ese email', variant: 'error' });
      } else if (error instanceof ApiError && error.errors) {
        setErrors(error.errors);
      } else {
        showDialog({ title: 'Error', message: error.message || 'No se pudo registrar la cuenta', variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader title="Seguridad y pagos" subtitle="Paso 2 de 2" shape="brown" onBack={() => navigation.goBack()} embedded />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="tu@email.com" error={errors.email} />
          <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
          <Input
            label="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
          />
          <Button title="Guardar y agregar medio de pago" onPress={() => handleRegister(true)} loading={loading} />
          <Button title="Agregar más tarde" variant="outline" onPress={() => handleRegister(false)} disabled={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.sm },
});
