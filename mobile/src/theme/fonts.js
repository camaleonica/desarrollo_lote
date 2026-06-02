import { Roboto_400Regular, Roboto_100Thin_Italic } from '@expo-google-fonts/roboto';
import { Rubik80sFade_400Regular } from '@expo-google-fonts/rubik-80s-fade';
import { useFonts } from 'expo-font';

export const fontAssets = {
  Roboto_400Regular,
  Roboto_100Thin_Italic,
  Rubik80sFade_400Regular,
};

export const fonts = {
  regular: 'Roboto_400Regular',
  thinItalic: 'Roboto_100Thin_Italic',
  rubik80s: 'Rubik80sFade_400Regular',
};

export function useAppFonts() {
  const [loaded, error] = useFonts(fontAssets);
  return { loaded, error };
}
