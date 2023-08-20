// expo-font @expo-google-fonts/anton @expo-google-fonts/archivo @expo-google-fonts/cinzel @expo-google-fonts/inter @expo-google-fonts/jost @expo-google-fonts/koulen @expo-google-fonts/limelight @expo-google-fonts/lora @expo-google-fonts/manrope @expo-google-fonts/monoton @expo-google-fonts/montserrat @expo-google-fonts/poppins @expo-google-fonts/raleway @expo-google-fonts/righteous @expo-google-fonts/rye

import { Anton_400Regular } from '@expo-google-fonts/anton';
import { Archivo_400Regular } from '@expo-google-fonts/archivo';
import { Cinzel_400Regular } from '@expo-google-fonts/cinzel';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { Jost_400Regular } from '@expo-google-fonts/jost';
import { Koulen_400Regular } from '@expo-google-fonts/koulen';
import { Limelight_400Regular } from '@expo-google-fonts/limelight';
import { Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';
import {
  Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
} from '@expo-google-fonts/manrope';
import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { Raleway_400Regular } from '@expo-google-fonts/raleway';
import { Righteous_400Regular } from '@expo-google-fonts/righteous';
import { Rye_400Regular } from '@expo-google-fonts/rye';
import { useFonts } from 'expo-font';
import type { ApplicationFonts } from '@azzapp/shared/fontHelpers';

const fontMap: Record<ApplicationFonts, any> = {
  Anton_Regular: Anton_400Regular,
  Archivo_Regular: Archivo_400Regular,
  Cinzel_Regular: Cinzel_400Regular,
  Inter_Regular: Inter_400Regular,
  Inter_Medium: Inter_500Medium,
  Inter_SemiBold: Inter_600SemiBold,
  Inter_Black: Inter_900Black,
  Jost_Regular: Jost_400Regular,
  Koulen_Regular: Koulen_400Regular,
  Limelight_Regular: Limelight_400Regular,
  Lora_Regular: Lora_400Regular,
  Lora_Bold: Lora_700Bold,
  Manrope_ExtraLight: Manrope_200ExtraLight,
  Manrope_Light: Manrope_300Light,
  Manrope_Regular: Manrope_400Regular,
  Montserrat_Regular: Montserrat_400Regular,
  Montserrat_SemiBold: Montserrat_600SemiBold,
  Poppins_Regular: Poppins_400Regular,
  Poppins_SemiBold: Poppins_600SemiBold,
  Poppins_Bold: Poppins_700Bold,
  Poppins_Black: Poppins_900Black,
  Raleway_Regular: Raleway_400Regular,
  Righteous_Regular: Righteous_400Regular,
  Rye_Regular: Rye_400Regular,
};

const useApplicationFonts = () => {
  return useFonts(fontMap);
};

export default useApplicationFonts;
