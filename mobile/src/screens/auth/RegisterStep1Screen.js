import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { FormScreen } from '../../components/layout/FormScreen';
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

  const apellidoRef = useRef(null);
  const domicilioRef = useRef(null);
  const paisRef = useRef(null);

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
      <ScreenHeader
        title="Verificación de identidad"
        subtitle="Paso 1 de 2"
        shape="brown"
        onBack={() => navigation.goBack()}
        embedded
      />
      <FormScreen contentContainerStyle={styles.container}>
        <Input
          label="Nombre"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Tu nombre"
          error={errors.nombre}
          nextInputRef={apellidoRef}
        />
        <Input
          ref={apellidoRef}
          label="Apellido"
          value={apellido}
          onChangeText={setApellido}
          placeholder="Tu apellido"
          error={errors.apellido}
          nextInputRef={domicilioRef}
        />
        <Input
          ref={domicilioRef}
          label="Domicilio legal"
          value={domicilio}
          onChangeText={setDomicilio}
          placeholder="Calle, número, ciudad"
          error={errors.domicilio}
          nextInputRef={paisRef}
        />
        <Input
          ref={paisRef}
          label="País de origen"
          value={pais}
          onChangeText={setPais}
          placeholder="Argentina"
          error={errors.pais}
        />
        <DniUploadField label="Foto DNI — frente" value={dniFrente} onChange={setDniFrente} error={errors.dni_frente} />
        <DniUploadField label="Foto DNI — dorso" value={dniDorso} onChange={setDniDorso} error={errors.dni_dorso} />
        <Button title="Continuar" onPress={handleContinue} />
      </FormScreen>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
});
