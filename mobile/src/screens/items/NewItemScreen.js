import { useState } from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { spacing } from '../../theme';
import { validateNewItem } from '../../utils/validation';
import { createItem } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { SvgAsset } from '../../components/SvgAsset';
import { useDialog } from '../../context/DialogContext';

export function NewItemScreen({ navigation }) {
  const { showDialog } = useDialog();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Arte');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const fieldErrors = validateNewItem({ titulo, descripcion, categoria });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setLoading(true);
    try {
      await createItem({ titulo, descripcion, categoria });
      showDialog({
        title: 'Enviado',
        message: 'Tu solicitud fue registrada y quedó pendiente de revisión.',
        variant: 'success',
        buttons: [{ text: 'Entendido', style: 'primary', onPress: () => navigation.goBack() }],
      });
    } catch (error) {
      if (error instanceof ApiError && error.errors) setErrors(error.errors);
      else showDialog({ title: 'Error', message: error.message || 'No se pudo enviar la solicitud', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader
          title="Solicitud de artículo"
          subtitle="Completá los datos para publicar"
          shape="brown"
          onBack={() => navigation.goBack()}
          embedded
        />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <SvgAsset name="agregar" width={48} height={48} style={styles.icon} />
          <Input label="Título" value={titulo} onChangeText={setTitulo} placeholder="Nombre del artículo" error={errors.titulo} />
          <Input
            label="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Detalle del artículo"
            multiline
            error={errors.descripcion}
          />
          <Input label="Categoría" value={categoria} onChangeText={setCategoria} placeholder="Arte / Antigüedades" error={errors.categoria} />
          <Input label="Fotos" value="" onChangeText={() => {}} placeholder="Próximamente" optional />
          <Button title="Enviar solicitud" onPress={handleSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg },
  icon: { alignSelf: 'center', marginBottom: spacing.md },
});
