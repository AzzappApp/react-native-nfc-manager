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
import type {
  WebcardTitleFonts,
  WebcardTextFonts,
} from '@azzapp/shared/fontHelpers';
import type { NextFont } from 'next/dist/compiled/@next/font';
import type { CSSProperties } from 'react';

const AmaticSC_Bold = Amatic_SC({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const AmaticSC_Regular = Amatic_SC({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Anton_Regular = Anton({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Archivo_Black = Archivo({
  weight: '900',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Archivo_Light = Archivo({
  weight: '300',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const BebasNeue_Regular = Bebas_Neue({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Cardo_Regular = Cardo({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const CormorantGaramond_Bold = Cormorant_Garamond({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const CormorantGaramond_Regular = Cormorant_Garamond({
  weight: '500',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const CourrierPrime_Regular = Courier_Prime({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Cinzel_Regular = Cinzel({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const DMSerifDisplay_Regular = DM_Serif_Display({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const FaunaOne_Regular = Fauna_One({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Fraunces_Light = Fraunces({
  weight: '300',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Inter_Regular = Inter({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Inter_Medium = Inter({
  weight: '500',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Inter_SemiBold = Inter({
  weight: '600',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Inter_Black = Inter({
  weight: '900',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const JosefinSans_Regular = Josefin_Sans({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Jost_Regular = Jost({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const GildaDisplay_Regular = Gilda_Display({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Gloock_Regular = Gloock({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  adjustFontFallback: false,
  preload: false,
});
const GreatVibes_Regular = Great_Vibes({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Kaushan_Regular = Kaushan_Script({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Koulen_Regular = Koulen({
  weight: '400',
  display: 'swap',
  subsets: ['latin'],
  preload: false,
});
const Lexend_ExtraBold = Lexend({
  weight: '800',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const LibreBaskerville_Italic = Libre_Baskerville({
  weight: '400',
  style: 'italic',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const LibreCaslonDisplay_Regular = Libre_Caslon_Display({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const LibreCaslonText_Regular = Libre_Caslon_Text({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Limelight_Regular = Limelight({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Lora_Regular = Lora({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Lora_Bold = Lora({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Manrope_ExtraLight = Manrope({
  weight: '200',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Manrope_Light = Manrope({
  weight: '300',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Manrope_Regular = Manrope({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Monoton_Regular = Monoton({
  weight: '400',
  display: 'swap',
  subsets: ['latin'],
  preload: false,
});
const Montserrat_Regular = Montserrat({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Montserrat_SemiBold = Montserrat({
  weight: '600',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const MrDafoe_Regular = Mr_Dafoe({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const OpenSans_Regular = Open_Sans({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Outfit_Medium = Outfit({
  weight: '500',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const PlayfairDisplay_Bold = Playfair_Display({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
export const Plus_Jakarta_Light = Plus_Jakarta_Sans({
  weight: '300',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
export const Plus_Jakarta_ExtraBold = Plus_Jakarta_Sans({
  weight: '800',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Poppins_Regular = Poppins({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Poppins_SemiBold = Poppins({
  weight: '600',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Poppins_Bold = Poppins({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Poppins_Black = Poppins({
  weight: '900',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Raleway_Regular = Raleway({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Righteous_Regular = Righteous({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Rubik_Bold = Rubik({
  weight: '700',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Rye_Regular = Rye({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const SeaweedScript_Regular = Seaweed_Script({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const SixCaps_Regular = Six_Caps({
  weight: '400',
  display: 'swap',
  subsets: ['latin'],
  preload: false,
});
const SourceSans3_Regular = Source_Sans_3({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const SourcePro_Regular = Source_Sans_3({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const Ultra_Regular = Ultra({
  weight: '400',
  display: 'swap',
  subsets: ['latin'],
  preload: false,
});
const WaterBrush_Regular = Water_Brush({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});
const YesevaOne_Regular = Yeseva_One({
  weight: '400',
  display: 'swap',
  subsets: ['latin-ext'],
  preload: false,
});

export const webCardTextFontsMap: Record<WebcardTextFonts, NextFont> = {
  SourceSans3_Regular,
  Raleway_Regular,
  'Plus-Jakarta_Light': Plus_Jakarta_Light,
  OpenSans_Regular,
  Montserrat_Regular,
  Jost_Regular,
  JosefinSans_Regular,
  Fraunces_Light,
  CourrierPrime_Regular,
  CormorantGaramond_Regular,
  Archivo_Light,
  Inter_Regular,
};

type fontVariants = {
  bold: CSSProperties;
};

export const webCardTextFontsVariantsMap: Record<
  WebcardTextFonts,
  fontVariants
> = {
  SourcePro_Regular_Bold: { bold: { fontWeight: '600', fontFamily: 'bold' } },
  SourceSans3_Regular: { bold: { fontWeight: '600', fontFamily: 'bold' } },
  Raleway_Regular: { bold: { fontWeight: '600', fontFamily: 'bold' } },
  'Plus-Jakarta_Light': { bold: { fontWeight: '600', fontFamily: 'bold' } },
  OpenSans_Regular: { bold: { fontWeight: '600', fontFamily: 'bold' } },
  Montserrat_Regular: { bold: { fontWeight: '600', fontFamily: 'bold' } },
  Jost_Regular: { bold: { fontWeight: '600', fontFamily: 'bold' } },
  JosefinSans_Regular: { bold: { fontWeight: '600', fontFamily: 'bold' } },
  Fraunces_Light: { bold: { fontWeight: '600', fontFamily: 'bold' } },
  CourrierPrime_Regular: { bold: { fontWeight: '700', fontFamily: 'bold' } },
  CormorantGaramond_Regular: {
    bold: { fontWeight: '600', fontFamily: 'bold' },
  },
  Archivo_Light: { bold: { fontWeight: '600', fontFamily: 'bold' } },
  Inter_Regular: { bold: { fontWeight: '600', fontFamily: 'bold' } },
};

export const webCardTitleFontsMap: Record<WebcardTitleFonts, NextFont> = {
  AmaticSC_Bold,
  AmaticSC_Regular,
  Anton_Regular,
  Archivo_Black,
  Archivo_Light,
  BebasNeue_Regular,
  Cardo_Regular,
  Cinzel_Regular,
  CormorantGaramond_Bold,
  CormorantGaramond_Regular,
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
} satisfies Record<WebcardTitleFonts, NextFont>;

export const fontsMap = {
  ...webCardTitleFontsMap,
  ...webCardTextFontsMap,
};
