import { Roboto_400Regular, Roboto_400Regular_Italic } from '@expo-google-fonts/roboto';
import { Rubik80sFade_400Regular } from '@expo-google-fonts/rubik-80s-fade';
import { useFonts } from 'expo-font';

export const fontAssets = {
  Roboto_400Regular,
  Roboto_400Regular_Italic,
  Rubik80sFade_400Regular,
};

export const fonts = {
  regular: 'Roboto_400Regular',
  /** Itálica legible (Roboto 400 italic, reemplaza el thin 100) */
  thinItalic: 'Roboto_400Regular_Italic',
  italic: 'Roboto_400Regular_Italic',
  rubik80s: 'Rubik80sFade_400Regular',
};

export function useAppFonts() {
  const [loaded, error] = useFonts(fontAssets);
  return { loaded, error };
}
