import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback } from 'react-native';

/**
 * Contenedor estándar para formularios: evita que el teclado tape campos
 * y permite cerrarlo al tocar fuera o al arrastrar el scroll.
 */
export function FormScreen({
  children,
  contentContainerStyle,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 64 : 0,
  style,
}) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
