import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { colors, spacing, typography, fonts } from '../../theme';
import { validateLoginForm } from '../../utils/validation';
import { login, fetchPaymentMethods } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';

export function LoginScreen({ navigation }) {
  const { setUser, setPendingPaymentSetup } = useAuth();
  const { showDialog } = useDialog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const fieldErrors = validateLoginForm({ email, password });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setLoading(true);
    try {
      const data = await login(email, password);
      const methods = await fetchPaymentMethods();
      if (methods.length === 0) {
        setPendingPaymentSetup(true);
        navigation.reset({
          index: 0,
          routes: [{ name: 'PaymentMethods', params: { fromRegistration: true } }],
        });
        return;
      }
      setPendingPaymentSetup(false);
      setUser({
        ...data.user,
        id: data.user?.id != null ? Number(data.user.id) : data.user?.id,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        showDialog({ title: 'Error', message: 'Usuario o contraseña incorrectos', variant: 'error' });
      } else {
        showDialog({ title: 'Error', message: error.message || 'No se pudo iniciar sesión', variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenLayout shape="lightBlue" safe>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Accedé a tu cuenta" shape="brown" />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            error={errors.email}
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••"
            secureTextEntry
            error={errors.password}
          />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <Button title="Ingresar" onPress={handleLogin} loading={loading} />

          <TouchableOpacity onPress={() => navigation.navigate('RegisterStep1')} style={styles.registerWrap}>
            <Text style={styles.registerText}>
              ¿No tenés cuenta? <Text style={styles.registerBold}>Registrate</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'center',
  },
  link: {
    ...typography.caption,
    fontSize: 14,
    color: colors.teal,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  registerWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  registerText: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textMuted,
  },
  registerBold: {
    fontFamily: fonts.thinItalic,
    color: colors.brown,
  },
});
