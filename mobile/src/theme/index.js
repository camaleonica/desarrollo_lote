export const colors = {
  lightBlue: '#A8C9E0',
  brown: '#5C2A20',
  ochre: '#B96E25',
  lavender: '#BAA4AE',
  lavenderSoft: 'rgba(186, 164, 174, 0.56)',
  teal: '#255957',
  white: '#FFFFFF',
  background: '#FFFFFF',
  text: '#2C2C2C',
  textMuted: '#6B6B6B',
  error: '#C0392B',
  success: '#255957',
  border: '#BAA4AE',
};

export const shapeColors = {
  lightBlue: colors.lightBlue,
  lavender: colors.lavender,
};

export const accentColors = {
  brown: colors.brown,
  ochre: colors.ochre,
  teal: colors.teal,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export { fonts, fontAssets, useAppFonts } from './fonts';

export const typography = {
  brandXL: { fontFamily: 'Roboto_100Thin_Italic', fontSize: 56, color: colors.text },
  brandLG: { fontFamily: 'Roboto_100Thin_Italic', fontSize: 42, color: colors.text },
  brandMD: { fontFamily: 'Roboto_100Thin_Italic', fontSize: 32, color: colors.text },
  title: { fontFamily: 'Roboto_400Regular', fontSize: 24, color: colors.brown },
  titleSm: { fontFamily: 'Roboto_400Regular', fontSize: 22, color: colors.brown },
  subtitle: { fontFamily: 'Roboto_400Regular', fontSize: 18, color: colors.text },
  body: { fontFamily: 'Roboto_400Regular', fontSize: 16, color: colors.text },
  bodyBold: { fontFamily: 'Roboto_400Regular', fontSize: 16, color: colors.text },
  label: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: colors.text },
  caption: { fontFamily: 'Roboto_100Thin_Italic', fontSize: 12, color: colors.textMuted },
  captionMd: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: colors.textMuted },
  button: { fontFamily: 'Roboto_400Regular', fontSize: 16 },
  price: { fontFamily: 'Roboto_400Regular', fontSize: 20, color: colors.ochre },
  priceXL: { fontFamily: 'Roboto_400Regular', fontSize: 36, color: colors.brown },
};
