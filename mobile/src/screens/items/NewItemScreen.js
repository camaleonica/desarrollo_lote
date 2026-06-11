import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { FormScreen } from '../../components/layout/FormScreen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { spacing, typography, colors } from '../../theme';
import { createItem } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useDialog } from '../../context/DialogContext';

const MIN_PHOTOS = 6;

export function NewItemScreen({ navigation }) {
  const { showDialog } = useDialog();
  const [descripcion, setDescripcion] = useState('');
  const [historia, setHistoria] = useState('');
  const [datosRelevantes, setDatosRelevantes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MIN_PHOTOS,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos(result.assets.slice(0, MIN_PHOTOS));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.photos;
        return next;
      });
    }
  }

  async function handleSubmit() {
    const fieldErrors = {};
    if (!descripcion.trim()) fieldErrors.descripcion = 'La descripción es obligatoria';
    if (photos.length < MIN_PHOTOS) fieldErrors.photos = `Subí al menos ${MIN_PHOTOS} fotos`;
    if (!legalAccepted) fieldErrors.legal = 'Debés aceptar la declaración legal';
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setLoading(true);
    try {
      await createItem({
        titulo: descripcion.slice(0, 80),
        descripcion,
        historia,
        datos_relevantes: datosRelevantes,
        declaracion_legal: true,
        photos,
      });
      showDialog({
        title: 'Enviado',
        message: 'Tu solicitud fue registrada y quedó pendiente de revisión.',
        variant: 'success',
        buttons: [{ text: 'Entendido', style: 'primary', onPress: () => navigation.goBack() }],
      });
    } catch (error) {
      showDialog({
        title: 'Error',
        message: error instanceof ApiError ? error.message : 'No se pudo enviar la solicitud',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <ScreenHeader title="Solicitud de artículo" subtitle="Completá los datos para publicar" shape="brown" onBack={() => navigation.goBack()} embedded />
      <FormScreen contentContainerStyle={styles.container}>
          <Input label="Descripción" value={descripcion} onChangeText={setDescripcion} placeholder="Describí el artículo" multiline error={errors.descripcion} />
          <Input label="Historia" value={historia} onChangeText={setHistoria} placeholder="Contexto, procedencia, curiosidades" multiline optional />
          <Input label="Datos relevantes" value={datosRelevantes} onChangeText={setDatosRelevantes} placeholder="Artista, fecha, materiales..." multiline optional />

          <Text style={styles.label}>Fotos ({photos.length}/{MIN_PHOTOS} mínimo)</Text>
          <Button title="Seleccionar fotos" variant="outline" onPress={pickPhotos} />
          {errors.photos ? <Text style={styles.error}>{errors.photos}</Text> : null}

          <Pressable style={styles.checkRow} onPress={() => setLegalAccepted((v) => !v)}>
            <MaterialIcons name={legalAccepted ? 'check-box' : 'check-box-outline-blank'} size={24} color={colors.brown} />
            <Text style={styles.checkText}>
              Declaro que el bien me pertenece y no tiene impedimentos legales para subastarlo.
            </Text>
          </Pressable>
          {errors.legal ? <Text style={styles.error}>{errors.legal}</Text> : null}

          <Button title="Enviar solicitud" onPress={handleSubmit} loading={loading} />
      </FormScreen>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
  label: { ...typography.label, color: colors.textMuted },
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginVertical: spacing.sm },
  checkText: { ...typography.body, flex: 1, lineHeight: 22 },
  error: { ...typography.captionMd, color: colors.error },
});
