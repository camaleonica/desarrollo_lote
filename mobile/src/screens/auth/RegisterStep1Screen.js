import { useState } from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { spacing } from '../../theme';
import { validateRegisterStep1 } from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';

export function RegisterStep1Screen({ navigation }) {
  const { registerDraft, setRegisterDraft } = useAuth();
  const [nombre, setNombre] = useState(registerDraft.nombre || '');
  const [apellido, setApellido] = useState(registerDraft.apellido || '');
  const [tipoDocumento, setTipoDocumento] = useState(registerDraft.tipo_documento || 'DNI');
  const [numeroDocumento, setNumeroDocumento] = useState(registerDraft.numero_documento || '');
  const [errors, setErrors] = useState({});

  function handleContinue() {
    const fieldErrors = validateRegisterStep1({
      nombre,
      apellido,
      numero_documento: numeroDocumento,
    });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setRegisterDraft({
      ...registerDraft,
      nombre,
      apellido,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
    });
    navigation.navigate('RegisterStep2');
  }

  return (
    <ScreenLayout shape="lightBlue" safe>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader title="Verificación de identidad" subtitle="Paso 1 de 2" shape="brown" onBack={() => navigation.goBack()} embedded />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Input label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" error={errors.nombre} />
          <Input label="Apellido" value={apellido} onChangeText={setApellido} placeholder="Tu apellido" error={errors.apellido} />
          <Input label="Tipo de documento" value={tipoDocumento} onChangeText={setTipoDocumento} placeholder="DNI" optional />
          <Input
            label="Número de documento"
            value={numeroDocumento}
            onChangeText={setNumeroDocumento}
            placeholder="30123456"
            keyboardType="numeric"
            error={errors.numero_documento}
          />
          <Button title="Continuar" onPress={handleContinue} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg },
});
