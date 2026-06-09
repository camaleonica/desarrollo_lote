import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, typography } from '../../theme';

export function DniUploadField({ label, value, onChange, error }) {
  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      onChange(result.assets[0]);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.box, error && styles.boxError]} onPress={pickImage}>
        {value?.uri ? (
          <Image source={{ uri: value.uri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons name="add-a-photo" size={28} color={colors.brown} />
            <Text style={styles.placeholderText}>Tocá para subir foto</Text>
          </View>
        )}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs, color: colors.text },
  box: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    minHeight: 120,
    overflow: 'hidden',
  },
  boxError: { borderColor: colors.error },
  preview: { width: '100%', height: 140 },
  placeholder: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  placeholderText: { ...typography.captionMd, color: colors.textMuted },
  error: { ...typography.captionMd, color: colors.error, marginTop: spacing.xs },
});
