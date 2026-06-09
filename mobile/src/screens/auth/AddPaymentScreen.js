import { useState } from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform, View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { spacing, typography, colors } from '../../theme';
import { addPaymentMethod } from '../../services/loteApi';
import { ApiError } from '../../services/api';
import { useDialog } from '../../context/DialogContext';

const PAYMENT_TYPES = [
  { id: 'credit_card', label: 'Tarjeta de crédito', icon: 'credit-card' },
  { id: 'bank_account', label: 'Cuenta bancaria', icon: 'account-balance' },
];

const CURRENCIES = [
  { id: 'ARS', label: 'Pesos' },
  { id: 'USD', label: 'Dólares' },
];

export function AddPaymentScreen({ navigation, route }) {
  const fromRegistration = Boolean(route.params?.fromRegistration);
  const { showDialog } = useDialog();
  const [type, setType] = useState('credit_card');
  const [currency, setCurrency] = useState('ARS');
  const [banco, setBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [ultimosDigitos, setUltimosDigitos] = useState('');
  const [marcaTarjeta, setMarcaTarjeta] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isCard = type === 'credit_card';

  function handleTypeChange(nextType) {
    if (nextType === type) return;
    setType(nextType);
    setErrors({});
    setBanco('');
    setNumeroCuenta('');
    setUltimosDigitos('');
    setMarcaTarjeta('');
  }

  async function handleSave() {
    const nextErrors = {};
    if (isCard) {
      if (!ultimosDigitos.trim()) nextErrors.ultimos_digitos = 'Los últimos 4 dígitos son obligatorios';
      else if (ultimosDigitos.trim().length !== 4) nextErrors.ultimos_digitos = 'Ingresá exactamente 4 dígitos';
    } else {
      if (!banco.trim()) nextErrors.banco = 'El banco es obligatorio';
      if (!numeroCuenta.trim()) nextErrors.numero_cuenta = 'El número de cuenta es obligatorio';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await addPaymentMethod({
        type,
        currency,
        card_brand: marcaTarjeta || 'Tarjeta',
        card_last4: ultimosDigitos,
        bank_name: banco,
        account_number: numeroCuenta,
      });
      showDialog({
        title: 'Guardado',
        message: 'Medio de pago agregado correctamente',
        variant: 'success',
        buttons: [
          {
            text: 'Entendido',
            style: 'primary',
            onPress: () => {
              if (fromRegistration) {
                navigation.navigate('PaymentMethods', { fromRegistration: true });
              } else {
                navigation.goBack();
              }
            },
          },
        ],
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
          <Text style={styles.sectionLabel}>Tipo de medio</Text>
          <View style={styles.typeRow}>
            {PAYMENT_TYPES.map(({ id, label, icon }) => {
              const active = type === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => handleTypeChange(id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.typeIconWrap, active && styles.typeIconWrapActive]}>
                    <MaterialIcons name={icon} size={22} color={active ? colors.white : colors.brown} />
                  </View>
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Moneda</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map(({ id, label }) => (
              <TouchableOpacity
                key={id}
                style={[styles.currencyChip, currency === id && styles.currencyChipActive]}
                onPress={() => setCurrency(id)}
              >
                <Text style={[styles.currencyText, currency === id && styles.currencyTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {isCard ? (
            <>
              <Input
                label="Marca de la tarjeta (opcional)"
                value={marcaTarjeta}
                onChangeText={setMarcaTarjeta}
                placeholder="Visa, Mastercard..."
                optional
              />
              <Input
                label="Últimos 4 dígitos"
                value={ultimosDigitos}
                onChangeText={setUltimosDigitos}
                placeholder="1234"
                keyboardType="numeric"
                maxLength={4}
                error={errors.ultimos_digitos || errors.card_last4}
              />
            </>
          ) : (
            <>
              <Input label="Banco" value={banco} onChangeText={setBanco} placeholder="Banco Nación" error={errors.banco} />
              <Input
                label="Número de cuenta"
                value={numeroCuenta}
                onChangeText={setNumeroCuenta}
                placeholder="1234567890"
                keyboardType="numeric"
                error={errors.numero_cuenta || errors.account_number}
              />
            </>
          )}

          <Button title="Guardar" onPress={handleSave} loading={loading} />
          <Button title="Cancelar" variant="outline" onPress={() => navigation.goBack()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  sectionLabel: { ...typography.label, color: colors.textMuted, marginTop: spacing.xs },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeChipActive: {
    borderColor: colors.brown,
    backgroundColor: '#F8F4F6',
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.lightBlue}55`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconWrapActive: {
    backgroundColor: colors.brown,
  },
  chipLabel: {
    ...typography.captionMd,
    fontSize: 12,
    textAlign: 'center',
    color: colors.text,
  },
  chipLabelActive: {
    ...typography.label,
    fontSize: 12,
    color: colors.brown,
  },
  currencyRow: { flexDirection: 'row', gap: spacing.sm },
  currencyChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.brown,
    alignItems: 'center',
  },
  currencyChipActive: { backgroundColor: colors.brown },
  currencyText: { ...typography.label, color: colors.brown },
  currencyTextActive: { color: colors.white },
});
