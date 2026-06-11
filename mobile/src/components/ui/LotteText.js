import { forwardRef } from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { fonts } from '../../theme/fonts';

const baseText = StyleSheet.create({
  default: { fontFamily: fonts.regular },
}).default;

export function Text(props) {
  return <RNText {...props} style={[baseText, props.style]} />;
}

export const TextInput = forwardRef(function LotteTextInput(props, ref) {
  return <RNTextInput ref={ref} {...props} style={[baseText, props.style]} />;
});
