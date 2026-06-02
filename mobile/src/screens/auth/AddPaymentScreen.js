import { useState } from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform, View, TouchableOpacity } from 'react-native';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { spacing } from '../../theme';
import { addPaymentMethod } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { svgAssets } from '../../assets/svg';
import { useDialog } from '../../context/DialogContext';

const PAYMENT_TYPES = [
  { id: 'Tarjeta de crédito', label: 'Tarjeta de crédito', Icon: svgAssets.tarjetaCredito },
  { id: 'Cuenta bancaria', label: 'Cuenta bancaria', Icon: svgAssets.cuentaBancaria },
  { id: 'Cheque certificado', label: 'Cheque certificado', Icon: svgAssets.chequeCertificado },
];

export function AddPaymentScreen({ navigation }) {
  const { showDialog } = useDialog();
  const [tipo, setTipo] = useState('Tarjeta de crédito');
  const [titular, setTitular] = useState('');
  const [ultimosDigitos, setUltimosDigitos] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const selected = PAYMENT_TYPES.find((item) => item.id === tipo) || PAYMENT_TYPES[0];
  const PreviewIcon = selected.Icon;

  async function handleSave() {
    const nextErrors = {};
    if (!titular.trim()) nextErrors.titular = 'El titular es obligatorio';
    if (!ultimosDigitos.trim()) nextErrors.ultimos_digitos = 'Los últimos dígitos son obligatorios';
    else if (ultimosDigitos.trim().length < 4) nextErrors.ultimos_digitos = 'Ingresá al menos 4 dígitos';
    if (!tipo.trim()) nextErrors.tipo = 'El tipo es obligatorio';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await addPaymentMethod({ tipo, titular, ultimos_digitos: ultimosDigitos });
      showDialog({
        title: 'Guardado',
        message: 'Medio de pago agregado correctamente',
        variant: 'success',
        buttons: [{ text: 'Entendido', style: 'primary', onPress: () => navigation.goBack() }],
      });
    } catch (error) {
      if (error instanceof ApiError && error.errors) setErrors(error.errors);
      else showDialog({ title: 'Error', message: error.message || 'No se pudo guardar', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenLayout shape="lavender" safe>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader
          title="Nuevo medio de pago"
          subtitle="Elegí el tipo y completá los datos"
          shape="brown"
          onBack={() => navigation.goBack()}
          embedded
        />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.typeRow}>
            {PAYMENT_TYPES.map(({ id, label, Icon }) => (
              <TouchableOpacity
                key={id}
                style={[styles.typeChip, tipo === id && styles.typeChipActive]}
                onPress={() => setTipo(id)}
              >
                <Icon width={72} height={28} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.preview}>
            <PreviewIcon width="100%" height={72} />
          </View>

          <Input label="Tipo" value={tipo} onChangeText={setTipo} placeholder="Tarjeta / Cuenta bancaria" error={errors.tipo} />
          <Input label="Titular" value={titular} onChangeText={setTitular} placeholder="Nombre del titular" error={errors.titular} />
          <Input
            label="Últimos dígitos"
            value={ultimosDigitos}
            onChangeText={setUltimosDigitos}
            placeholder="1234"
            keyboardType="numeric"
            error={errors.ultimos_digitos}
          />
          <Button title="Guardar" onPress={handleSave} loading={loading} />
          <Button title="Cancelar" variant="outline" onPress={() => navigation.goBack()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.sm },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  typeChip: {
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D5DB',
    backgroundColor: '#FFFFFF',
  },
  typeChipActive: {
    borderColor: '#5C2A20',
    backgroundColor: '#F8F4F6',
  },
  preview: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
});
