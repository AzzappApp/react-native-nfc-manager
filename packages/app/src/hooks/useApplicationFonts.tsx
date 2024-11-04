import {
  AmaticSC_700Bold,
  AmaticSC_400Regular,
} from '@expo-google-fonts/amatic-sc';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { Archivo_300Light, Archivo_900Black } from '@expo-google-fonts/archivo';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Cardo_400Regular } from '@expo-google-fonts/cardo';
import { Cinzel_400Regular } from '@expo-google-fonts/cinzel';
import { CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { CourierPrime_400Regular } from '@expo-google-fonts/courier-prime';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { FaunaOne_400Regular } from '@expo-google-fonts/fauna-one';
import { Fraunces_300Light } from '@expo-google-fonts/fraunces';
import { GildaDisplay_400Regular } from '@expo-google-fonts/gilda-display';
import { Gloock_400Regular } from '@expo-google-fonts/gloock';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { JosefinSans_400Regular } from '@expo-google-fonts/josefin-sans';
import { Jost_400Regular } from '@expo-google-fonts/jost';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import { Koulen_400Regular } from '@expo-google-fonts/koulen';
import { Lexend_800ExtraBold } from '@expo-google-fonts/lexend';
import { LibreBaskerville_400Regular_Italic } from '@expo-google-fonts/libre-baskerville';
import { LibreCaslonDisplay_400Regular } from '@expo-google-fonts/libre-caslon-display';
import { LibreCaslonText_400Regular } from '@expo-google-fonts/libre-caslon-text';
import { Limelight_400Regular } from '@expo-google-fonts/limelight';
import { Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';
import {
  Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
} from '@expo-google-fonts/manrope';
import { Monoton_400Regular } from '@expo-google-fonts/monoton';
import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import { MrDafoe_400Regular } from '@expo-google-fonts/mr-dafoe';
import { OpenSans_400Regular } from '@expo-google-fonts/open-sans';
import { Outfit_500Medium } from '@expo-google-fonts/outfit';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { Raleway_400Regular } from '@expo-google-fonts/raleway';
import { Righteous_400Regular } from '@expo-google-fonts/righteous';
import { Rubik_700Bold } from '@expo-google-fonts/rubik';
import { Rye_400Regular } from '@expo-google-fonts/rye';
import { SeaweedScript_400Regular } from '@expo-google-fonts/seaweed-script';
import { SixCaps_400Regular } from '@expo-google-fonts/six-caps';
import { SourceSansPro_400Regular } from '@expo-google-fonts/source-sans-pro';
import { Ultra_400Regular } from '@expo-google-fonts/ultra';
import { WaterBrush_400Regular } from '@expo-google-fonts/water-brush';
import { YesevaOne_400Regular } from '@expo-google-fonts/yeseva-one';
import { matchFont, Skia } from '@shopify/react-native-skia';
import { useFonts } from 'expo-font';
import { Image } from 'react-native';
import type { ApplicationFonts } from '@azzapp/shared/fontHelpers';
import type { SkTypefaceFontProvider } from '@shopify/react-native-skia';

const fontMap: Record<ApplicationFonts, any> = {
  AmaticSC_Bold: AmaticSC_700Bold,
  AmaticSC_Regular: AmaticSC_400Regular,
  Anton_Regular: Anton_400Regular,
  Archivo_Black: Archivo_900Black,
  Archivo_Light: Archivo_300Light,
  BebasNeue_Regular: BebasNeue_400Regular,
  Cardo_Regular: Cardo_400Regular,
  CormorantGaramond_Bold: CormorantGaramond_700Bold,
  CourrierPrime_Regular: CourierPrime_400Regular,
  Cinzel_Regular: Cinzel_400Regular,
  DMSerifDisplay_Regular: DMSerifDisplay_400Regular,
  FaunaOne_Regular: FaunaOne_400Regular,
  Fraunces_Light: Fraunces_300Light,
  Inter_Regular: Inter_400Regular,
  Inter_Medium: Inter_500Medium,
  Inter_SemiBold: Inter_600SemiBold,
  Inter_Black: Inter_900Black,
  JosefinSans_Regular: JosefinSans_400Regular,
  Jost_Regular: Jost_400Regular,
  GildaDisplay_Regular: GildaDisplay_400Regular,
  Gloock_Regular: Gloock_400Regular,
  GreatVibes_Regular: GreatVibes_400Regular,
  Kaushan_Regular: KaushanScript_400Regular,
  Koulen_Regular: Koulen_400Regular,
  Lexend_ExtraBold: Lexend_800ExtraBold,
  LibreBaskerville_Italic: LibreBaskerville_400Regular_Italic,
  LibreCaslonText_Regular: LibreCaslonText_400Regular,
  LibreCaslonDisplay_Regular: LibreCaslonDisplay_400Regular,
  Limelight_Regular: Limelight_400Regular,
  Lora_Regular: Lora_400Regular,
  Lora_Bold: Lora_700Bold,
  Manrope_ExtraLight: Manrope_200ExtraLight,
  Manrope_Light: Manrope_300Light,
  Manrope_Regular: Manrope_400Regular,
  Monoton_Regular: Monoton_400Regular,
  Montserrat_Regular: Montserrat_400Regular,
  Montserrat_SemiBold: Montserrat_600SemiBold,
  MrDafoe_Regular: MrDafoe_400Regular,
  OpenSans_Regular: OpenSans_400Regular,
  Outfit_Medium: Outfit_500Medium,
  PlayfairDisplay_Bold: PlayfairDisplay_700Bold,
  'Plus-Jakarta_Light': PlusJakartaSans_300Light,
  'Plus-Jakarta_ExtraBold': PlusJakartaSans_800ExtraBold,
  Poppins_Regular: Poppins_400Regular,
  Poppins_SemiBold: Poppins_600SemiBold,
  Poppins_Bold: Poppins_700Bold,
  Poppins_Black: Poppins_900Black,
  Raleway_Regular: Raleway_400Regular,
  Rubik_Bold: Rubik_700Bold,
  Righteous_Regular: Righteous_400Regular,
  Rye_Regular: Rye_400Regular,
  SeaweedScript_Regular: SeaweedScript_400Regular,
  SixCaps_Regular: SixCaps_400Regular,
  SourcePro_Regular: SourceSansPro_400Regular,
  Ultra_Regular: Ultra_400Regular,
  WaterBrush_Regular: WaterBrush_400Regular,
  YesevaOne_Regular: YesevaOne_400Regular,
};

export const skiaFontManager: SkTypefaceFontProvider =
  Skia.TypefaceFontProvider.Make();

const skiaFonts = {
  ...fontMap,
  PlusJakartaSans_Regular: PlusJakartaSans_400Regular,
};

const priorityFonts = [
  'PlusJakartaSans_Regular',
  'Plus-Jakarta_Light',
  'Plus-Jakarta_ExtraBold',
];

const reversedSkiaFonts = Object.fromEntries(
  Object.entries(skiaFonts).map(([key, value]) => [value, key]),
);
const loadedSkiaFonts = new Set<string>();
const fontsPromise = new Map<string, Promise<any>>();

let skiaFontManagerLoadingInitialized = false;
export const loadSkiaTypeFonts = () => {
  if (skiaFontManagerLoadingInitialized) {
    return;
  }
  skiaFontManagerLoadingInitialized = true;
  Object.entries(skiaFonts)
    .sort(([familyNameA], [familyNameB]) => {
      if (priorityFonts.includes(familyNameA)) {
        return -1;
      }
      if (priorityFonts.includes(familyNameB)) {
        return 1;
      }
      return 0;
    })
    .forEach(([familyName, typefaceToLoad]) => {
      const uri = Image.resolveAssetSource(typefaceToLoad).uri;
      const promise = Skia.Data.fromURI(uri).then(
        data => {
          const tf = Skia.Typeface.MakeFreeTypeFaceFromData(data);
          if (tf === null) {
            console.warn(`Couldn't create typeface for ${familyName}`);
            return null;
          }
          skiaFontManager.registerFont(tf, familyName);
          loadedSkiaFonts.add(familyName);
          fontsPromise.delete(familyName);
        },
        err => {
          console.warn('Failed to load typeface', err);
          fontsPromise.delete(familyName);
          return null;
        },
      );
      fontsPromise.set(familyName, promise);
    });
};

const useApplicationFonts = () => {
  return useFonts(fontMap);
};

export default useApplicationFonts;

export const useApplicationSkiaFont = (font: number, fontSize: number) => {
  const fontFamily = reversedSkiaFonts[font];
  if (!fontFamily) {
    throw new Error(`Font ${font} not found`);
  }
  if (loadedSkiaFonts.has(fontFamily)) {
    return matchFont({ fontFamily, fontSize }, skiaFontManager);
  }
  if (!fontsPromise.has(fontFamily)) {
    throw new Error(`Font ${fontFamily} not found`);
  }
  throw fontsPromise.get(fontFamily);
};
