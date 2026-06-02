import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { spacing } from '../../theme';
import { validateEmail } from '../../utils/validation';
import { forgotPassword } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useDialog } from '../../context/DialogContext';

export function ForgotPasswordScreen({ navigation }) {
  const { showDialog } = useDialog();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!email.trim()) {
      setError('El email es obligatorio');
      return;
    }
    if (!validateEmail(email)) {
      setError('El email no es válido');
      return;
    }

    setLoading(true);
    try {
      const data = await forgotPassword(email);
      showDialog({
        title: 'Listo',
        message: data.message,
        variant: 'success',
        buttons: [{ text: 'Entendido', style: 'primary', onPress: () => navigation.goBack() }],
      });
    } catch (err) {
      showDialog({
        title: 'Error',
        message: err instanceof ApiError ? err.message : 'No se pudo enviar el email',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenLayout shape="lightBlue" safe>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader
          title="Recuperar contraseña"
          subtitle="Te enviaremos un enlace a tu email"
          shape="brown"
          onBack={() => navigation.goBack()}
          embedded
        />
        <View style={styles.container}>
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="tu@email.com" error={error} />
          <Button title="Enviar" onPress={handleSend} loading={loading} />
          <Button title="Volver al login" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.sm },
});
