import { forwardRef } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { Text, TextInput } from './LotteText';
import { colors, radius, spacing, typography } from '../../theme';

export const Input = forwardRef(function Input(
  {
    label,
    value,
    onChangeText,
    onBlur,
    onSubmitEditing,
    placeholder,
    error,
    secureTextEntry = false,
    keyboardType = 'default',
    optional = false,
    multiline = false,
    returnKeyType,
    blurOnSubmit,
    nextInputRef,
    dismissKeyboardOnSubmit = true,
    autoCapitalize,
    maxLength,
  },
  ref
) {
  const resolvedReturnKeyType = returnKeyType || (multiline ? 'default' : nextInputRef ? 'next' : 'done');
  const resolvedBlurOnSubmit = blurOnSubmit ?? !multiline;

  function handleSubmitEditing(event) {
    if (onSubmitEditing) {
      onSubmitEditing(event);
      return;
    }
    if (nextInputRef?.current) {
      nextInputRef.current.focus();
      return;
    }
    if (dismissKeyboardOnSubmit && !multiline) {
      Keyboard.dismiss();
    }
  }

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {optional ? ' (opcional)' : ''}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        onSubmitEditing={handleSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        multiline={multiline}
        returnKeyType={resolvedReturnKeyType}
        blurOnSubmit={resolvedBlurOnSubmit}
        submitBehavior={multiline ? 'newline' : 'blurAndSubmit'}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
