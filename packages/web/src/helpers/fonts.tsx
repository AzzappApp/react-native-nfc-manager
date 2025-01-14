import {
  Amatic_SC,
  Anton,
  Archivo,
  Bebas_Neue,
  Cardo,
  Courier_Prime,
  Cinzel,
  Cormorant_Garamond,
  DM_Serif_Display,
  Fauna_One,
  Fraunces,
  Inter,
  Josefin_Sans,
  Jost,
  Gilda_Display,
  Gloock,
  Great_Vibes,
  Kaushan_Script,
  Koulen,
  Lexend,
  Libre_Baskerville,
  Libre_Caslon_Display,
  Libre_Caslon_Text,
  Limelight,
  Lora,
  Manrope,
  Montserrat,
  Mr_Dafoe,
  Open_Sans,
  Outfit,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Poppins,
  Raleway,
  Righteous,
  Rubik,
  Rye,
  Seaweed_Script,
  Six_Caps,
  Source_Sans_3,
  Yeseva_One,
  Ultra,
  Water_Brush,
  Monoton,
} from 'next/font/google';
import type { ApplicationFonts } from '@azzapp/shared/fontHelpers';
import type { NextFont } from 'next/dist/compiled/@next/font';

const AmaticSC_Bold = Amatic_SC({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
});
const AmaticSC_Regular = Amatic_SC({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Anton_Regular = Anton({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Archivo_Black = Archivo({
  weight: '900',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Archivo_Light = Archivo({
  weight: '300',
  display: 'swap',
  subsets: ['latin-ext'],
});
const BebasNeue_Regular = Bebas_Neue({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Cardo_Regular = Cardo({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const CormorantGaramond_Bold = Cormorant_Garamond({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
});
const CourrierPrime_Regular = Courier_Prime({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Cinzel_Regular = Cinzel({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const DMSerifDisplay_Regular = DM_Serif_Display({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const FaunaOne_Regular = Fauna_One({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Fraunces_Light = Fraunces({
  weight: '300',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Inter_Regular = Inter({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Inter_Medium = Inter({
  weight: '500',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Inter_SemiBold = Inter({
  weight: '600',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Inter_Black = Inter({
  weight: '900',
  display: 'swap',
  subsets: ['latin-ext'],
});
const JosefinSans_Regular = Josefin_Sans({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Jost_Regular = Jost({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const GildaDisplay_Regular = Gilda_Display({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Gloock_Regular = Gloock({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  adjustFontFallback: false,
});
const GreatVibes_Regular = Great_Vibes({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Kaushan_Regular = Kaushan_Script({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Koulen_Regular = Koulen({
  weight: '400',
  display: 'swap',
  subsets: ['latin'],
});
const Lexend_ExtraBold = Lexend({
  weight: '800',
  display: 'swap',
  subsets: ['latin-ext'],
});
const LibreBaskerville_Italic = Libre_Baskerville({
  weight: '400',
  style: 'italic',
  display: 'swap',
  subsets: ['latin-ext'],
});
const LibreCaslonDisplay_Regular = Libre_Caslon_Display({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const LibreCaslonText_Regular = Libre_Caslon_Text({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Limelight_Regular = Limelight({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Lora_Regular = Lora({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Lora_Bold = Lora({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Manrope_ExtraLight = Manrope({
  weight: '200',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Manrope_Light = Manrope({
  weight: '300',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Manrope_Regular = Manrope({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Monoton_Regular = Monoton({
  weight: '400',
  display: 'swap',
  subsets: ['latin'],
});
const Montserrat_Regular = Montserrat({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Montserrat_SemiBold = Montserrat({
  weight: '600',
  display: 'swap',
  subsets: ['latin-ext'],
});
const MrDafoe_Regular = Mr_Dafoe({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const OpenSans_Regular = Open_Sans({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Outfit_Medium = Outfit({
  weight: '500',
  display: 'swap',
  subsets: ['latin-ext'],
});
const PlayfairDisplay_Bold = Playfair_Display({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
});
export const Plus_Jakarta_Light = Plus_Jakarta_Sans({
  weight: '300',
  display: 'swap',
  subsets: ['latin-ext'],
});
export const Plus_Jakarta_ExtraBold = Plus_Jakarta_Sans({
  weight: '800',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Poppins_Regular = Poppins({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Poppins_SemiBold = Poppins({
  weight: '600',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Poppins_Bold = Poppins({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Poppins_Black = Poppins({
  weight: '900',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Raleway_Regular = Raleway({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Righteous_Regular = Righteous({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Rubik_Bold = Rubik({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Rye_Regular = Rye({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const SeaweedScript_Regular = Seaweed_Script({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const SixCaps_Regular = Six_Caps({
  weight: '400',
  display: 'swap',
  subsets: ['latin'],
});
const SourcePro_Regular = Source_Sans_3({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const Ultra_Regular = Ultra({
  weight: '400',
  display: 'swap',
  subsets: ['latin'],
});
const WaterBrush_Regular = Water_Brush({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});
const YesevaOne_Regular = Yeseva_One({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
});

export const fontsMap: Record<string, NextFont> = {
  AmaticSC_Bold,
  AmaticSC_Regular,
  Anton_Regular,
  Archivo_Black,
  Archivo_Light,
  BebasNeue_Regular,
  Cardo_Regular,
  Cinzel_Regular,
  CormorantGaramond_Bold,
  CourrierPrime_Regular,
  DMSerifDisplay_Regular,
  FaunaOne_Regular,
  Fraunces_Light,
  GildaDisplay_Regular,
  Gloock_Regular,
  GreatVibes_Regular,
  Inter_Regular,
  Inter_Medium,
  Inter_SemiBold,
  Inter_Black,
  JosefinSans_Regular,
  Jost_Regular,
  Kaushan_Regular,
  Koulen_Regular,
  Lexend_ExtraBold,
  LibreBaskerville_Italic,
  LibreCaslonDisplay_Regular,
  LibreCaslonText_Regular,
  Limelight_Regular,
  Lora_Regular,
  Lora_Bold,
  Manrope_ExtraLight,
  Manrope_Light,
  Manrope_Regular,
  Monoton_Regular,
  Montserrat_Regular,
  Montserrat_SemiBold,
  MrDafoe_Regular,
  OpenSans_Regular,
  Outfit_Medium,
  PlayfairDisplay_Bold,
  'Plus-Jakarta_Light': Plus_Jakarta_Light,
  'Plus-Jakarta_ExtraBold': Plus_Jakarta_ExtraBold,
  Poppins_Regular,
  Poppins_SemiBold,
  Poppins_Bold,
  Poppins_Black,
  Raleway_Regular,
  Rubik_Bold,
  Righteous_Regular,
  Rye_Regular,
  SeaweedScript_Regular,
  SixCaps_Regular,
  SourcePro_Regular,
  Ultra_Regular,
  WaterBrush_Regular,
  YesevaOne_Regular,
} satisfies Record<ApplicationFonts, NextFont>;
