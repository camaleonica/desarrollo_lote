import { Text } from 'react-native';
import { typography } from '../theme';

export function AppText({ variant = 'body', style, children, ...props }) {
  return (
    <Text style={[typography[variant], style]} {...props}>
      {children}
    </Text>
  );
}
