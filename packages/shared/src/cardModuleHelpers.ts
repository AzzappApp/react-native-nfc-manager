import uniq from 'lodash/uniq';
import { getValuesFromStyle, type CardStyle } from './cardHelpers';

//#region SimpleText
export const MODULE_KIND_SIMPLE_TEXT = 'simpleText';

export type CardModuleSimpleTextData = {
  text: string;
  fontFamily?: string | null;
  fontColor?: string | null;
  textAlign?: TextAlignment | null;
  fontSize?: number | null;
  verticalSpacing?: number | null;
  marginHorizontal?: number | null;
  marginVertical?: number | null;
  backgroundId?: string | null;
  backgroundStyle?: ModuleBackgroundStyle | null;
};

export const SIMPLE_TEXT_STYLE_VALUES = {
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
} as const satisfies Partial<
  Record<keyof CardModuleSimpleTextData, keyof CardStyle>
>;

export const SIMPLE_TEXT_DEFAULT_VALUES = {
  fontColor: '#000000',
  textAlign: 'center',
  verticalSpacing: 12,
  marginHorizontal: 20,
  marginVertical: 20,
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'primary',
  },
} as const satisfies Partial<CardModuleSimpleTextData>;

export const SIMPLE_TEXT_MAX_LENGTH = 2000;
//#endregion

//#region SimpleTitle
export const MODULE_KIND_SIMPLE_TITLE = 'simpleTitle';

export const SIMPLE_TITLE_STYLE_VALUES = {
  fontFamily: 'titleFontFamily',
  fontSize: 'titleFontSize',
} as const satisfies Partial<
  Record<keyof CardModuleSimpleTextData, keyof CardStyle>
>;

export const SIMPLE_TITLE_DEFAULT_VALUES = {
  fontColor: '#000000',
  textAlign: 'center',
  verticalSpacing: 20,
  marginHorizontal: 20,
  marginVertical: 20,
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'primary',
  },
} as const satisfies Partial<CardModuleSimpleTextData>;

export const SIMPLE_TITLE_MAX_LENGTH = 300;
//#endregion

//#region LineDivider
export const MODULE_KIND_LINE_DIVIDER = 'lineDivider';

export type CardModuleLineDividerData = {
  orientation?: 'bottomRight' | 'topLeft' | null;
  marginBottom?: number | null;
  marginTop?: number | null;
  height?: number | null;
  colorTop?: string | null;
  colorBottom?: string | null;
};

export const LINE_DIVIDER_DEFAULT_VALUES = {
  orientation: 'topLeft',
  marginBottom: 0,
  marginTop: 0,
  height: 100,
  colorTop: 'light',
  colorBottom: 'dark',
} as const satisfies Partial<CardModuleLineDividerData>;
//#endregion

//#region HorizontalPhoto
export const MODULE_KIND_HORIZONTAL_PHOTO = 'horizontalPhoto';

export type CardModuleHorizontalPhotoData = {
  image: string;
  borderWidth?: number | null;
  borderColor?: string | null;
  borderRadius?: number | null;
  marginHorizontal?: number | null;
  marginVertical?: number | null;
  imageHeight?: number | null;
  backgroundId?: string | null;
  backgroundStyle?: ModuleBackgroundStyle | null;
};

export const HORIZONTAL_PHOTO_STYLE_VALUES = {
  borderRadius: 'borderRadius',
} as const satisfies Partial<
  Record<keyof CardModuleHorizontalPhotoData, keyof CardStyle>
>;

export const HORIZONTAL_PHOTO_DEFAULT_VALUES = {
  borderWidth: 0,
  borderColor: '#FFFFFF',
  imageHeight: 200,
  marginHorizontal: 20,
  marginVertical: 20,
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'primary',
  },
} as const satisfies Partial<CardModuleHorizontalPhotoData>;
//#endregion

//#region Carousel
export const MODULE_KIND_CAROUSEL = 'carousel';

export type CardModuleCarouselData = {
  images: string[];
  squareRatio?: boolean | null;
  borderWidth?: number | null;
  borderColor?: string | null;
  borderRadius?: number | null;
  marginHorizontal?: number | null;
  marginVertical?: number | null;
  imageHeight?: number | null;
  gap?: number | null;
  backgroundId?: string | null;
  backgroundStyle?: ModuleBackgroundStyle | null;
};

export const CAROUSEL_STYLE_VALUES = {
  borderRadius: 'borderRadius',
  gap: 'gap',
} as const satisfies Partial<
  Record<keyof CardModuleCarouselData, keyof CardStyle>
>;

export const CAROUSEL_DEFAULT_VALUES = {
  borderWidth: 0,
  borderColor: '#FFFFFF',
  borderRadius: 0,
  marginVertical: 20,
  marginHorizontal: 20,
  imageHeight: 300,
  squareRatio: false,
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'primary',
  },
} as const satisfies Partial<CardModuleCarouselData>;

//#endregion

//#region SimpleButton
export const MODULE_KIND_SIMPLE_BUTTON = 'simpleButton';

export type CardModuleSimpleButtonData = {
  buttonLabel: string;
  actionType: string;
  actionLink: string;
  fontFamily?: string | null;
  fontColor?: string | null;
  fontSize?: number | null;
  buttonColor?: string | null;
  borderColor?: string | null;
  borderWidth?: number | null;
  borderRadius?: number | null;
  marginTop?: number | null;
  marginBottom?: number | null;
  width?: number | null;
  height?: number | null;
  backgroundId?: string | null;
  backgroundStyle?: ModuleBackgroundStyle | null;
};

export const SIMPLE_BUTTON_STYLE_VALUES = {
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  borderRadius: 'buttonRadius',
  borderWidth: 'borderWidth',
  borderColor: 'borderColor',
} as const satisfies Partial<
  Record<keyof CardModuleSimpleButtonData, keyof CardStyle>
>;

export const SIMPLE_BUTTON_DEFAULT_VALUES = {
  fontColor: 'dark',
  buttonColor: 'light',
  height: 54,
  width: 200,
  marginTop: 20,
  marginBottom: 20,
} as const satisfies Partial<CardModuleSimpleButtonData>;
//#endregion

//#region PhotoWithTextAndTitle
export const MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE = 'photoWithTextAndTitle';

export type CardModulePhotoWithTextAndTitleData = {
  image: string;
  contentFontFamily?: string | null;
  contentFontColor?: string | null;
  contentTextAlign?: TextAlignment | null;
  contentFontSize?: number | null;
  contentVerticalSpacing?: number | null;
  content?: string | null;
  titleFontFamily?: string | null;
  titleFontColor?: string | null;
  titleTextAlign?: TextAlignment | null;
  titleFontSize?: number | null;
  titleVerticalSpacing?: number | null;
  title?: string | null;
  imageMargin?: 'width_full' | 'width_limited' | null;
  horizontalArrangement?: 'left' | 'right' | null;
  verticalArrangement?: 'bottom' | 'top' | null;
  gap?: number | null;
  borderRadius?: number | null;
  marginHorizontal?: number | null;
  marginVertical?: number | null;
  aspectRatio?: number | null;
  backgroundId?: string | null;
  backgroundStyle?: ModuleBackgroundStyle | null;
};

export const PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES = {
  contentFontFamily: 'fontFamily',
  contentFontSize: 'fontSize',
  titleFontFamily: 'titleFontFamily',
  titleFontSize: 'titleFontSize',
  borderRadius: 'borderRadius',
} as const satisfies Partial<
  Record<
    keyof CardModulePhotoWithTextAndTitleData,
    keyof CardStyle | 'textSize'
  >
>;

export const PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES = {
  contentTextAlign: 'left',
  titleTextAlign: 'left',
  contentVerticalSpacing: 12,
  titleVerticalSpacing: 12,
  contentFontColor: '#000000',
  titleFontColor: '#000000',
  imageMargin: 'width_full',
  horizontalArrangement: 'left',
  verticalArrangement: 'top',
  aspectRatio: 1,
  marginHorizontal: 20,
  marginVertical: 20,
  gap: 20,
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'primary',
  },
} as const satisfies Partial<CardModulePhotoWithTextAndTitleData>;
//#endregion

//#region SocialLinks
export const MODULE_KIND_SOCIAL_LINKS = 'socialLinks';

export type CardModuleSocialLinksData = {
  links: Array<{ socialId: string; link: string; position: number }>;
  iconColor?: string | null;
  arrangement?: 'inline' | 'multiline' | null;
  iconSize?: number | null;
  borderWidth?: number | null;
  columnGap?: number | null;
  marginTop?: number | null;
  marginBottom?: number | null;
  marginHorizontal?: number | null;
  backgroundId?: string | null;
  backgroundStyle?: ModuleBackgroundStyle | null;
};

export const SOCIAL_LINKS_DEFAULT_VALUES = {
  arrangement: 'multiline',
  iconSize: 44,
  iconColor: 'primary',
  borderWidth: 2,
  columnGap: 20,
  marginTop: 20,
  marginBottom: 20,
  marginHorizontal: 20,
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'primary',
  },
} as const satisfies Partial<CardModuleSocialLinksData>;
//#endregion

//#region BlockText
export const MODULE_KIND_BLOCK_TEXT = 'blockText';

export type CardModuleBlockTextData = {
  text: string;
  fontFamily?: string | null;
  fontColor?: string | null;
  textAlign?: TextAlignment | null;
  fontSize?: number | null;
  verticalSpacing?: number | null;
  textMarginVertical?: number | null;
  textMarginHorizontal?: number | null;
  marginHorizontal?: number | null;
  marginVertical?: number | null;
  textBackgroundStyle?: ModuleTextBackgroundStyle | null;
  textBackgroundId?: string | null;
  backgroundStyle?: ModuleBackgroundStyle | null;
  backgroundId?: string | null;
};

export const BLOCK_TEXT_STYLE_VALUES = {
  fontSize: 'fontSize',
  fontFamily: 'fontFamily',
} as const satisfies Partial<
  Record<keyof CardModuleBlockTextData, keyof CardStyle>
>;

export const BLOCK_TEXT_DEFAULT_VALUES = {
  verticalSpacing: 12,
  textAlign: 'center',
  marginHorizontal: 20,
  marginVertical: 20,
  textMarginVertical: 20,
  textMarginHorizontal: 20,
  fontColor: '#FFFFFF',
  textBackgroundStyle: {
    backgroundColor: 'dark',
    patternColor: 'primary',
    opacity: 1,
  },
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'primary',
  },
} as const satisfies Partial<CardModuleBlockTextData>;
//#endregion

//#region OpeningHours
export const MODULE_KIND_OPENING_HOURS = 'openingHours';
// TODO add opening hours type
//#endregion

//#region WebCardsCarousel
export const MODULE_KIND_WEB_CARDS_CAROUSEL = 'webCardsCarousel';
//TODO add web cards carousel type
//#endregion

//#region Commons
export const MODULE_KINDS = [
  MODULE_KIND_BLOCK_TEXT,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_OPENING_HOURS,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
  MODULE_KIND_WEB_CARDS_CAROUSEL,
] as const;

export const MODULES_STYLES_VALUES = {
  [MODULE_KIND_BLOCK_TEXT]: BLOCK_TEXT_STYLE_VALUES,
  [MODULE_KIND_CAROUSEL]: CAROUSEL_STYLE_VALUES,
  [MODULE_KIND_HORIZONTAL_PHOTO]: HORIZONTAL_PHOTO_STYLE_VALUES,
  [MODULE_KIND_LINE_DIVIDER]: {},
  [MODULE_KIND_OPENING_HOURS]: {},
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]:
    PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
  [MODULE_KIND_SIMPLE_BUTTON]: SIMPLE_BUTTON_STYLE_VALUES,
  [MODULE_KIND_SIMPLE_TEXT]: SIMPLE_TEXT_STYLE_VALUES,
  [MODULE_KIND_SIMPLE_TITLE]: SIMPLE_TITLE_STYLE_VALUES,
  [MODULE_KIND_SOCIAL_LINKS]: {},
  [MODULE_KIND_WEB_CARDS_CAROUSEL]: {},
} as const;

export const MODULES_DEFAULT_VALUES = {
  [MODULE_KIND_BLOCK_TEXT]: BLOCK_TEXT_DEFAULT_VALUES,
  [MODULE_KIND_CAROUSEL]: CAROUSEL_DEFAULT_VALUES,
  [MODULE_KIND_HORIZONTAL_PHOTO]: HORIZONTAL_PHOTO_DEFAULT_VALUES,
  [MODULE_KIND_LINE_DIVIDER]: LINE_DIVIDER_DEFAULT_VALUES,
  [MODULE_KIND_OPENING_HOURS]: {},
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]:
    PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
  [MODULE_KIND_SIMPLE_BUTTON]: SIMPLE_BUTTON_DEFAULT_VALUES,
  [MODULE_KIND_SIMPLE_TEXT]: SIMPLE_TEXT_DEFAULT_VALUES,
  [MODULE_KIND_SIMPLE_TITLE]: SIMPLE_TITLE_DEFAULT_VALUES,
  [MODULE_KIND_SOCIAL_LINKS]: SOCIAL_LINKS_DEFAULT_VALUES,
  [MODULE_KIND_WEB_CARDS_CAROUSEL]: {},
} as const;

export type ModuleKind = (typeof MODULE_KINDS)[number];

export type ModuleBackgroundStyle = {
  backgroundColor: string;
  patternColor: string;
};

export type ModuleTextBackgroundStyle = {
  backgroundColor: string;
  patternColor: string;
  opacity: number;
};

export type TextAlignment = 'center' | 'justify' | 'left' | 'right';

/**
 * the max width of the module images
 */
export const MODULE_IMAGE_MAX_WIDTH = 2048;
/**
 * the list of possible post images pregenerated sizes
 */
export const MODULE_IMAGES_SIZES = [128, 256, 512, 1024, 1536];

//#endregion

// #region Helpers function
/**
 * Helper function to get the values for rendering a module.
 * It will return the values from the module data, by merging the values from the card style
 * and the default values.
 */
export const getModuleDataValues = <
  TModuleData extends object,
  TStyleValues extends object,
  TDefaultValues extends object,
>({
  data,
  cardStyle,
  styleValuesMap,
  defaultValues,
}: {
  /**
   * The module data.
   */
  data: TModuleData;
  /**
   * The card style used to render the web card.
   */
  cardStyle: CardStyle | null | undefined;
  /**
   * A map of the module data keys to the card style keys.
   */
  styleValuesMap: TStyleValues | null | undefined;
  /**
   * The default values for the module data.
   */
  defaultValues: TDefaultValues;
}): {
  [key in keyof TModuleData]-?: key extends keyof TStyleValues
    ? Exclude<TModuleData[key], null | undefined>
    : key extends keyof TDefaultValues
    ? TDefaultValues[key] extends NonNullable<unknown>
      ? Exclude<TModuleData[key], null | undefined>
      : TModuleData[key]
    : TModuleData[key];
} => {
  const cardStyleValues = getValuesFromStyle(cardStyle, styleValuesMap as any);
  const fields = uniq([
    ...Object.keys(data),
    ...Object.keys(cardStyleValues ?? {}),
    ...Object.keys(defaultValues ?? {}),
  ]) as Array<keyof TModuleData>;

  return fields.reduce((acc, key) => {
    const value = data[key];
    if (value != null) {
      acc[key] = value;
    } else if (cardStyleValues[key] != null) {
      acc[key] = cardStyleValues[key];
    } else {
      acc[key] = (defaultValues as any)[key];
    }
    return acc;
  }, {} as any);
};

export const textAlignmentOrDefault = (
  textAlignment: unknown,
): TextAlignment => {
  if (
    ['center', 'justify', 'left', 'right'].includes(textAlignment as string)
  ) {
    return textAlignment as TextAlignment;
  }
  return 'center';
};
