import { useState } from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { DniUploadField } from '../../components/m3/DniUploadField';
import { spacing } from '../../theme';
import { validateRegisterStep1 } from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';

export function RegisterStep1Screen({ navigation }) {
  const { registerDraft, setRegisterDraft } = useAuth();
  const [nombre, setNombre] = useState(registerDraft.nombre || '');
  const [apellido, setApellido] = useState(registerDraft.apellido || '');
  const [domicilio, setDomicilio] = useState(registerDraft.domicilio || '');
  const [pais, setPais] = useState(registerDraft.pais || 'Argentina');
  const [dniFrente, setDniFrente] = useState(registerDraft.dni_frente || null);
  const [dniDorso, setDniDorso] = useState(registerDraft.dni_dorso || null);
  const [errors, setErrors] = useState({});

  function handleContinue() {
    const fieldErrors = validateRegisterStep1({
      nombre,
      apellido,
      domicilio,
      pais,
      dni_frente: dniFrente,
      dni_dorso: dniDorso,
    });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setRegisterDraft({
      ...registerDraft,
      nombre,
      apellido,
      domicilio,
      pais,
      dni_frente: dniFrente,
      dni_dorso: dniDorso,
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
          <Input label="Domicilio legal" value={domicilio} onChangeText={setDomicilio} placeholder="Calle, número, ciudad" error={errors.domicilio} />
          <Input label="País de origen" value={pais} onChangeText={setPais} placeholder="Argentina" error={errors.pais} />
          <DniUploadField label="Foto DNI — frente" value={dniFrente} onChange={setDniFrente} error={errors.dni_frente} />
          <DniUploadField label="Foto DNI — dorso" value={dniDorso} onChange={setDniDorso} error={errors.dni_dorso} />
          <Button title="Continuar" onPress={handleContinue} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
});
