/**
 * List of fonts that are supported by the application and can be used in
 * the cover and module editors.
 */
export const WEBCARD_TITLE_FONTS = [
  'AmaticSC_Bold',
  'AmaticSC_Regular',
  'Anton_Regular',
  'Archivo_Black',
  'BebasNeue_Regular',
  'Cardo_Regular',
  'Cinzel_Regular',
  'CormorantGaramond_Bold',
  'CormorantGaramond_Bold_Italic',
  'DMSerifDisplay_Regular',
  'FaunaOne_Regular',
  'GildaDisplay_Regular',
  'Gloock_Regular',
  'GreatVibes_Regular',
  'Inter_Medium',
  'Inter_SemiBold',
  'Inter_Black',
  'Kaushan_Regular',
  'Koulen_Regular',
  'Lexend_ExtraBold',
  'LibreBaskerville_Italic',
  'LibreCaslonDisplay_Regular',
  'LibreCaslonText_Regular',
  'Limelight_Regular',
  'Lora_Regular',
  'Lora_Bold',
  'Manrope_ExtraLight',
  'Manrope_Light',
  'Manrope_Regular',
  'Monoton_Regular',
  'Montserrat_SemiBold',
  'MrDafoe_Regular',
  'Outfit_Medium',
  'PlayfairDisplay_Bold',
  'Plus-Jakarta_ExtraBold',
  'Poppins_Regular',
  'Poppins_SemiBold',
  'Poppins_Bold',
  'Poppins_Black',
  'Rubik_Bold',
  'Righteous_Regular',
  'Rye_Regular',
  'SeaweedScript_Regular',
  'SixCaps_Regular',
  'SourcePro_Regular',
  'Ultra_Regular',
  'WaterBrush_Regular',
  'YesevaOne_Regular',
];

export const WEBCARD_TEXT_FONTS = [
  'SourceSans3_Regular',
  'Raleway_Regular',
  'Plus-Jakarta_Light',
  'OpenSans_Regular',
  'Montserrat_Regular',
  'Jost_Regular',
  'JosefinSans_Regular',
  'Fraunces_Light',
  'CourrierPrime_Regular',
  'CormorantGaramond_Regular',
  'Archivo_Light',
  'Inter_Regular',
];

export type WebcardTitleFonts = (typeof WEBCARD_TITLE_FONTS)[number];
export type WebcardTextFonts = (typeof WEBCARD_TEXT_FONTS)[number];

type fontVariants = {
  italic: string;
  bold: string;
  boldItalic: string;
};

export const MODULE_TEXT_FONTS_VARIANTS_OBJECT: Record<
  WebcardTextFonts,
  fontVariants
> = {
  SourceSans3_Regular: {
    italic: 'SourceSans3_Regular_Italic',
    bold: 'SourceSans3_Regular_Bold',
    boldItalic: 'SourceSans3_Regular_Bold_Italic',
  },
  Raleway_Regular: {
    italic: 'Raleway_Regular_Italic',
    bold: 'Raleway_Regular_Bold',
    boldItalic: 'Raleway_Regular_Bold_Italic',
  },
  'Plus-Jakarta_Light': {
    italic: 'Plus-Jakarta_Light_Italic',
    bold: 'Plus-Jakarta_Light_Bold',
    boldItalic: 'Plus-Jakarta_Light_Bold_Italic',
  },
  OpenSans_Regular: {
    italic: 'OpenSans_Regular_Italic',
    bold: 'OpenSans_Regular_Bold',
    boldItalic: 'OpenSans_Regular_Bold_Italic',
  },
  Montserrat_Regular: {
    italic: 'Montserrat_Regular_Italic',
    bold: 'Montserrat_Regular_Bold',
    boldItalic: 'Montserrat_Regular_Bold_Italic',
  },
  Jost_Regular: {
    bold: 'Jost_Regular_Bold',
    italic: 'Jost_Regular_Italic',
    boldItalic: 'Jost_Regular_Bold_Italic',
  },
  JosefinSans_Regular: {
    bold: 'JosefinSans_Regular_Bold',
    italic: 'JosefinSans_Regular_Italic',
    boldItalic: 'JosefinSans_Regular_Bold_Italic',
  },
  Fraunces_Light: {
    bold: 'Fraunces_Light_Bold',
    italic: 'Fraunces_Light_Italic',
    boldItalic: 'Fraunces_Light_Bold_Italic',
  },
  CourrierPrime_Regular: {
    italic: 'CourrierPrime_Regular_Italic',
    bold: 'CourrierPrime_Regular_Bold',
    boldItalic: 'CourrierPrime_Regular_Bold_Italic',
  },
  CormorantGaramond_Regular: {
    italic: 'CormorantGaramond_Regular_Italic',
    bold: 'CormorantGaramond_Regular_Bold',
    boldItalic: 'CormorantGaramond_Regular_Bold_Italic',
  },
  Archivo_Light: {
    bold: 'Archivo_Light_Bold',
    italic: 'Archivo_Light_Italic',
    boldItalic: 'Archivo_Light_Bold_Italic',
  },
  Inter_Regular: {
    italic: 'Inter_Regular_Italic',
    bold: 'Inter_Regular_Bold',
    boldItalic: 'Inter_Regular_Bold_Italic',
  },
};

/**
 * List of fonts that are supported by the application and can be used in
 * the cover and module editors.
 */
export const COVER_EDITOR_FONTS = [
  'AmaticSC_Bold',
  'AmaticSC_Regular',
  'Anton_Regular',
  'Archivo_Black',
  'Archivo_Light',
  'BebasNeue_Regular',
  'Cardo_Regular',
  'Cinzel_Regular',
  'CormorantGaramond_Bold',
  'CormorantGaramond_Bold_Italic',
  'CormorantGaramond_Regular',
  'CourrierPrime_Regular',
  'DMSerifDisplay_Regular',
  'FaunaOne_Regular',
  'Fraunces_Light',
  'GildaDisplay_Regular',
  'Gloock_Regular',
  'GreatVibes_Regular',
  'Inter_Regular',
  'Inter_Medium',
  'Inter_SemiBold',
  'Inter_Black',
  'JosefinSans_Regular',
  'Jost_Regular',
  'Kaushan_Regular',
  'Koulen_Regular',
  'Lexend_ExtraBold',
  'LibreBaskerville_Italic',
  'LibreCaslonDisplay_Regular',
  'LibreCaslonText_Regular',
  'Limelight_Regular',
  'Lora_Regular',
  'Lora_Bold',
  'Manrope_ExtraLight',
  'Manrope_Light',
  'Manrope_Regular',
  'Monoton_Regular',
  'Montserrat_Regular',
  'Montserrat_SemiBold',
  'MrDafoe_Regular',
  'OpenSans_Regular',
  'Outfit_Medium',
  'PlayfairDisplay_Bold',
  'Plus-Jakarta_Light',
  'Plus-Jakarta_ExtraBold',
  'Poppins_Regular',
  'Poppins_SemiBold',
  'Poppins_Bold',
  'Poppins_Black',
  'Raleway_Regular',
  'Rubik_Bold',
  'Righteous_Regular',
  'Rye_Regular',
  'SeaweedScript_Regular',
  'SixCaps_Regular',
  'SourceSans3_Regular',
  'Ultra_Regular',
  'WaterBrush_Regular',
  'YesevaOne_Regular',
];

export type CoverEditorFonts = (typeof COVER_EDITOR_FONTS)[number];

export const APPLICATIONS_FONTS = [
  ...new Set([
    ...COVER_EDITOR_FONTS,
    ...WEBCARD_TEXT_FONTS,
    ...WEBCARD_TITLE_FONTS,
    ...Object.keys(MODULE_TEXT_FONTS_VARIANTS_OBJECT).reduce((acc, f) => {
      const variant = MODULE_TEXT_FONTS_VARIANTS_OBJECT[f];
      acc.push(variant.bold);
      acc.push(variant.italic);
      acc.push(variant.boldItalic);
      return acc;
    }, [] as string[]),
  ]),
];

export type ApplicationFonts = (typeof APPLICATIONS_FONTS)[number];
