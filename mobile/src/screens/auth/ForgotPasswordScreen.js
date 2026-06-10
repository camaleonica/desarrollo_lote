import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { FormScreen } from '../../components/layout/FormScreen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
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
      <ScreenHeader
        title="Recuperar contraseña"
        subtitle="Te enviaremos un enlace a tu email (se abre en el navegador)"
        shape="brown"
        onBack={() => navigation.goBack()}
        embedded
      />
      <FormScreen contentContainerStyle={styles.container}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
          onSubmitEditing={handleSend}
        />
        <Button title="Enviar" onPress={handleSend} loading={loading} />
        <Button title="Volver al login" variant="outline" onPress={() => navigation.goBack()} />
      </FormScreen>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
});
