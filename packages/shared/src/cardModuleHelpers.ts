import uniq from 'lodash/uniq';
import { getValuesFromStyle, swapColor, type CardStyle } from './cardHelpers';

//#region BlockText
/**
 * Block text module kind
 */
export const MODULE_KIND_BLOCK_TEXT = 'blockText';

/**
 * The data type for the block text module
 */
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

/**
 * The values extracted from the card style for the block text module
 */
export const BLOCK_TEXT_STYLE_VALUES = {
  fontSize: 'fontSize',
  fontFamily: 'fontFamily',
} as const satisfies Partial<
  Record<keyof CardModuleBlockTextData, keyof CardStyle>
>;

/**
 * The default values for the block text module
 */
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
    opacity: 100,
  },
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'primary',
  },
} as const satisfies Partial<CardModuleBlockTextData>;

export const BLOCK_TEXT_DEFAULT_VALUES_DARK = {
  backgroundStyle: {
    backgroundColor: 'dark',
    patternColor: 'primary',
  },
  textBackgroundStyle: {
    backgroundColor: 'primary',
    patternColor: 'dark',
    opacity: 100,
  },
  fontColor: 'dark',
} as const;

export const BLOCK_TEXT_DEFAULT_VALUES_LIGHT = {
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'dark',
  },
  textBackgroundStyle: {
    backgroundColor: 'dark',
    patternColor: 'light',
    opacity: 100,
  },
  fontColor: 'light',
} as const;

export const BLOCK_TEXT_DEFAULT_VALUES_PRIMARY = {
  backgroundStyle: {
    backgroundColor: 'primary',
    patternColor: 'dark',
  },
  textBackgroundStyle: {
    backgroundColor: 'dark',
    patternColor: 'light',
    opacity: 100,
  },
  fontColor: 'light',
} as const;

export const getBlockTextDefaultColors = (
  coverBackgroundColor: string | null | undefined,
  data?: Pick<
    CardModuleBlockTextData,
    'backgroundStyle' | 'fontColor' | 'textBackgroundStyle'
  > | null,
) => {
  if (
    !coverBackgroundColor ||
    data?.backgroundStyle ||
    data?.fontColor ||
    data?.textBackgroundStyle
  )
    return {};

  const defaultValues: Record<string, Partial<CardModuleBlockTextData>> = {
    dark: BLOCK_TEXT_DEFAULT_VALUES_DARK,
    light: BLOCK_TEXT_DEFAULT_VALUES_LIGHT,
    primary: BLOCK_TEXT_DEFAULT_VALUES_PRIMARY,
  };

  return defaultValues[coverBackgroundColor];
};

/**
 * The maximum length of text for the block text module
 */
export const BLOCK_TEXT_MAX_LENGTH = 2000;

/**
 * The minimum font size for the block text module
 */
export const BLOCK_TEXT_MIN_FONT_SIZE = 6;

/**
 * The maximum font size for the block text module
 */
export const BLOCK_TEXT_MAX_FONT_SIZE = 128;

/**
 * The maximum vertical spacingthe block text module
 */
export const BLOCK_TEXT_MAX_VERTICAL_SPACING = 50;
/**
 * The maximum horizontal margin for the block text module
 */
export const BLOCK_TEXT_MAX_HORIZONTAL_MARGIN = 50;

/**
 * The maximum vertical margin for the block text module
 */
export const BLOCK_TEXT_MAX_VERTICAL_MARGIN = 100;

/**
 * The maximum horizontal textMargin for the block text module
 */
export const BLOCK_TEXT_TEXT_MAX_HORIZONTAL_MARGIN = 100;

/**
 * The maximum vertical textMargin for the block text module
 */
export const BLOCK_TEXT_TEXT_MAX_VERTICAL_MARGIN = 100;

//#endregion

//#region Carousel
/**
 * Carousel module kind
 */
export const MODULE_KIND_CAROUSEL = 'carousel';

/**
 * The data type for the carousel module
 */
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

/**
 * The values extracted from the card style for the carousel module
 */
export const CAROUSEL_STYLE_VALUES = {
  borderRadius: 'borderRadius',
  gap: 'gap',
} as const satisfies Partial<
  Record<keyof CardModuleCarouselData, keyof CardStyle>
>;

/**
 * The default values for the carousel module
 */
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

export const CAROUSEL_DEFAULT_VALUES_DARK = {
  backgroundStyle: {
    backgroundColor: 'dark',
    patternColor: 'light',
  },
} as const;

export const CAROUSEL_DEFAULT_VALUES_LIGHT = {
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'dark',
  },
} as const;

export const CAROUSEL_DEFAULT_VALUES_PRIMARY = {
  backgroundStyle: {
    backgroundColor: 'primary',
    patternColor: 'dark',
  },
} as const;

export const getCarouselDefaultColors = (
  coverBackgroundColor: string | null | undefined,
  data?: Pick<CardModuleHorizontalPhotoData, 'backgroundStyle'> | null,
) => {
  if (!coverBackgroundColor || data?.backgroundStyle) return {};

  const defaultValues: Record<
    string,
    Partial<CardModuleHorizontalPhotoData>
  > = {
    dark: CAROUSEL_DEFAULT_VALUES_DARK,
    light: CAROUSEL_DEFAULT_VALUES_LIGHT,
    primary: CAROUSEL_DEFAULT_VALUES_PRIMARY,
  };

  return defaultValues[coverBackgroundColor];
};
/**
 * The maximum image height for the carousel module
 */
export const CAROUSEL_MAX_IMAGE_HEIGHT = 600;

/**
 * The minimum image height for the carousel module
 */
export const CAROUSEL_MIN_IMAGE_HEIGHT = 10;

/**
 * The maximum border width for the carousel module
 */
export const CAROUSEL_MAX_BORDER_WIDTH = 50;

/**
 * The maximum border radius for the carousel module
 */
export const CAROUSEL_MAX_BORDER_RADIUS = 200;

/**
 * The maximum horizontal margin for the carousel module
 */
export const CAROUSEL_MAX_HORIZONTAL_MARGIN = 100;

/**
 * The maximum vertical margin for the carousel module
 */
export const CAROUSEL_MAX_VERTICAL_MARGIN = 200;

/**
 * The maximum gap for the carousel module
 */
export const CAROUSEL_MAX_GAP = 100;

//#endregion

//#region HorizontalPhoto
/**
 * Horizontal photo module kind
 */
export const MODULE_KIND_HORIZONTAL_PHOTO = 'horizontalPhoto';

/**
 * The data type for the horizontal photo module
 */
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

/**
 * The values extracted from the card style for the horizontal photo module
 */
export const HORIZONTAL_PHOTO_STYLE_VALUES = {
  borderRadius: 'borderRadius',
} as const satisfies Partial<
  Record<keyof CardModuleHorizontalPhotoData, keyof CardStyle>
>;

/**
 * The default values for the horizontal photo module
 */
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

export const HORIZONTAL_PHOTO_DEFAULT_VALUES_DARK = {
  backgroundStyle: {
    backgroundColor: 'dark',
    patternColor: 'light',
  },
} as const;

export const HORIZONTAL_PHOTO_DEFAULT_VALUES_LIGHT = {
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'dark',
  },
} as const;

export const HORIZONTAL_PHOTO_DEFAULT_VALUES_PRIMARY = {
  backgroundStyle: {
    backgroundColor: 'primary',
    patternColor: 'dark',
  },
} as const;

export const getHorizontalPhotoDefaultColors = (
  coverBackgroundColor: string | null | undefined,
  data?: Pick<CardModuleHorizontalPhotoData, 'backgroundStyle'> | null,
) => {
  if (!coverBackgroundColor || data?.backgroundStyle) return {};

  const defaultValues: Record<
    string,
    Pick<CardModuleHorizontalPhotoData, 'backgroundStyle'>
  > = {
    dark: HORIZONTAL_PHOTO_DEFAULT_VALUES_DARK,
    light: HORIZONTAL_PHOTO_DEFAULT_VALUES_LIGHT,
    primary: HORIZONTAL_PHOTO_DEFAULT_VALUES_PRIMARY,
  };

  return defaultValues[coverBackgroundColor];
};
/**
 * The maximum image height for the horizontal photo module
 */
export const HORIZONTAL_PHOTO_MAX_IMAGE_HEIGHT = 1000;

/**
 * The minimum image height for the horizontal photo module
 */
export const HORIZONTAL_PHOTO_MIN_IMAGE_HEIGHT = 10;

/**
 * The maximum border width for the horizontal photo module
 */
export const HORIZONTAL_PHOTO_MAX_BORDER_WIDTH = 50;

/**
 * The maximum border radius for the horizontal photo module
 */
export const HORIZONTAL_PHOTO_MAX_BORDER_RADIUS = 200;

/**
 * The maximum horizontal margin for the horizontal photo module
 */
export const HORIZONTAL_PHOTO_MAX_HORIZONTAL_MARGIN = 100;

/**
 * The maximum vertical margin for the horizontal photo module
 */
export const HORIZONTAL_PHOTO_MAX_VERTICAL_MARGIN = 200;

//#endregion

//#region LineDivider
/**
 * Line divider module kind
 */
export const MODULE_KIND_LINE_DIVIDER = 'lineDivider';

/**
 * The data type for the line divider module
 */
export type CardModuleLineDividerData = {
  orientation?: 'bottomRight' | 'topLeft' | null;
  marginBottom?: number | null;
  marginTop?: number | null;
  height?: number | null;
  colorTop?: string | null;
  colorBottom?: string | null;
};

/**
 * The default values for the line divider module
 */
export const LINE_DIVIDER_DEFAULT_VALUES = {
  orientation: 'topLeft',
  marginBottom: 0,
  marginTop: 0,
  height: 100,
  colorTop: 'light',
  colorBottom: 'dark',
} as const satisfies Partial<CardModuleLineDividerData>;

/**
 * The minimum height for the line divider module
 */
export const LINE_DIVIDER_MIN_HEIGHT = 1;

/**
 * The maximum height for the line divider module
 */
export const LINE_DIVIDER_MAX_HEIGHT = 600;

/**
 * The maximum margin bottom for the line divider module
 */
export const LINE_DIVIDER_MAX_MARGIN_BOTTOM = 200;

/**
 * The maximum margin top for the line divider module
 */
export const LINE_DIVIDER_MAX_MARGIN_TOP = 200;

//#endregion

//#region PhotoWithTextAndTitle
/**
 * Photo with text and title module kind
 */
export const MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE = 'photoWithTextAndTitle';

/**
 * The data type for the photo with text and title module
 */
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

/**
 * The values extracted from the card style for the photo with text and title module
 */
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

/**
 * The default values for the photo with text and title module
 */
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

export const PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES_DARK = {
  backgroundStyle: {
    backgroundColor: 'dark',
    patternColor: 'light',
  },
  titleFontColor: 'light',
  contentFontColor: 'light',
} as const;

export const PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES_LIGHT = {
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'dark',
  },
  titleFontColor: 'dark',
  contentFontColor: 'dark',
} as const;

export const PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES_PRIMARY = {
  backgroundStyle: {
    backgroundColor: 'primary',
    patternColor: 'dark',
  },
  titleFontColor: 'light',
  contentFontColor: 'light',
} as const;

export const getPhotoWithTextAndTitleDefaultColors = (
  coverBackgroundColor: string | null | undefined,
  data?: Pick<
    CardModulePhotoWithTextAndTitleData,
    'backgroundStyle' | 'contentFontColor' | 'titleFontColor'
  > | null,
) => {
  if (
    !coverBackgroundColor ||
    data?.backgroundStyle ||
    data?.titleFontColor ||
    data?.contentFontColor
  )
    return {};

  const defaultValues: Record<
    string,
    Pick<
      CardModulePhotoWithTextAndTitleData,
      'backgroundStyle' | 'contentFontColor' | 'titleFontColor'
    >
  > = {
    dark: PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES_DARK,
    light: PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES_LIGHT,
    primary: PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES_PRIMARY,
  };

  return defaultValues[coverBackgroundColor];
};
/**
 * The maximum content length for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_TEXT_MAX_LENGTH = 2000;

/**
 * The maximum title length for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_TITLE_MAX_LENGTH = 300;

/**
 * The minimum content font size for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MIN_FONT_SIZE = 6;

/**
 * The maximum content font size for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MAX_FONT_SIZE = 128;

/**
 * The minimum title font size for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MIN_TITLE_FONT_SIZE = 6;

/**
 * The maximum title font size for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MAX_TITLE_FONT_SIZE = 128;

/**
 * The maximum vertical spacing for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MAX_VERTICAL_SPACING = 50;

/**
 * The maximum border radius for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MAX_BORDER_RADIUS = 200;

/**
 * The maximum horizontal margin for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MAX_HORIZONTAL_MARGIN = 100;

/**
 * The maximum vertical margin for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MAX_VERTICAL_MARGIN = 200;

/**
 * The maximum gap for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MAX_GAP = 100;

/**
 * The maximum aspect ratio for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MAX_ASPECT_RATIO = 2;

/**
 * The minimum aspect ratio for the photo with text and title module
 */
export const PHOTO_WITH_TEXT_AND_TITLE_MIN_ASPECT_RATIO = 0.5;
//#endregion

//#region SimpleButton
/**
 * Simple button module kind
 */
export const MODULE_KIND_SIMPLE_BUTTON = 'simpleButton';

/**
 * The data type for the simple button module
 */
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

/**
 * The values extracted from the card style for the simple button module
 */
export const SIMPLE_BUTTON_STYLE_VALUES = {
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  borderRadius: 'buttonRadius',
  borderWidth: 'borderWidth',
  borderColor: 'borderColor',
} as const satisfies Partial<
  Record<keyof CardModuleSimpleButtonData, keyof CardStyle>
>;

/**
 * The default values for the simple button module
 */
export const SIMPLE_BUTTON_DEFAULT_VALUES = {
  fontColor: 'dark',
  buttonColor: 'primary',
  height: 54,
  width: 200,
  marginTop: 20,
  marginBottom: 20,
} as const satisfies Partial<CardModuleSimpleButtonData>;

export const SIMPLE_BUTTON_DEFAULT_VALUES_DARK = {
  backgroundStyle: {
    backgroundColor: 'dark',
    patternColor: 'primary',
  },
  buttonColor: 'primary',
  fontColor: 'dark',
} as const;

export const SIMPLE_BUTTON_DEFAULT_VALUES_LIGHT = {
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'primary',
  },
  buttonColor: 'primary',
  fontColor: 'light',
} as const;

export const SIMPLE_BUTTON_DEFAULT_VALUES_PRIMARY = {
  backgroundStyle: {
    backgroundColor: 'primary',
    patternColor: 'dark',
  },
  buttonColor: 'dark',
  fontColor: 'light',
} as const;

export const getButtonDefaultColors = (
  coverBackgroundColor: string | null | undefined,
  data?: Pick<
    CardModuleSimpleButtonData,
    'backgroundStyle' | 'buttonColor' | 'fontColor'
  > | null,
) => {
  if (
    !coverBackgroundColor ||
    data?.backgroundStyle ||
    data?.buttonColor ||
    data?.fontColor
  )
    return {};

  const defaultValues: Record<string, Partial<CardModuleSimpleButtonData>> = {
    dark: SIMPLE_BUTTON_DEFAULT_VALUES_DARK,
    light: SIMPLE_BUTTON_DEFAULT_VALUES_LIGHT,
    primary: SIMPLE_BUTTON_DEFAULT_VALUES_PRIMARY,
  };

  return defaultValues[coverBackgroundColor];
};

/**
 * The maximum button label length for the simple button module
 */
export const SIMPLE_BUTTON_MAX_LABEL_LENGTH = 200;

/**
 * The minimum font size for the simple button module
 */
export const SIMPLE_BUTTON_MIN_FONT_SIZE = 10;

/**
 * The maximum font size for the simple button module
 */
export const SIMPLE_BUTTON_MAX_FONT_SIZE = 64;

/**
 * The maximum height for the simple button module
 */
export const SIMPLE_BUTTON_MAX_HEIGHT = 200;

/**
 * The minimum height for the simple button module
 */
export const SIMPLE_BUTTON_MIN_HEIGHT = 10;

/**
 * The maximum width for the simple button module
 */
export const SIMPLE_BUTTON_MAX_WIDTH = 300;

/**
 * The minimum width for the simple button module
 */
export const SIMPLE_BUTTON_MIN_WIDTH = 20;

/**
 * The maximum border width for the simple button module
 */
export const SIMPLE_BUTTON_MAX_BORDER_WIDTH = 10;

/**
 * The maximum border radius for the simple button module
 */
export const SIMPLE_BUTTON_MAX_BORDER_RADIUS = 200;

/**
 * The maximum margin top for the simple button module
 */
export const SIMPLE_BUTTON_MAX_MARGIN_TOP = 200;

/**
 * The maximum margin bottom for the simple button module
 */
export const SIMPLE_BUTTON_MAX_MARGIN_BOTTOM = 200;

//#endregion

//#region SimpleText
/**
 * Simple text module kind
 */
export const MODULE_KIND_SIMPLE_TEXT = 'simpleText';

/**
 * The data type for the simple text module
 */
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

/**
 * The values extracted from the card style for the simple text module
 */
export const SIMPLE_TEXT_STYLE_VALUES = {
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
} as const satisfies Partial<
  Record<keyof CardModuleSimpleTextData, keyof CardStyle>
>;

/**
 * The default values for the simple text module
 */
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

export const SIMPLE_TEXT_DEFAULT_VALUES_DARK = {
  backgroundStyle: {
    backgroundColor: 'dark',
    patternColor: 'light',
  },
  fontColor: 'light',
} as const;

export const SIMPLE_TEXT_DEFAULT_VALUES_LIGHT = {
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'dark',
  },
  fontColor: 'dark',
} as const;

export const SIMPLE_TEXT_DEFAULT_VALUES_PRIMARY = {
  backgroundStyle: {
    backgroundColor: 'primary',
    patternColor: 'light',
  },
  fontColor: 'light',
} as const;

export const getTextDefaultValues = (
  coverBackgroundColor: string | null | undefined,
  data?: Pick<CardModuleSimpleTextData, 'backgroundStyle' | 'fontColor'> | null,
) => {
  if (!coverBackgroundColor || data?.backgroundStyle || data?.fontColor)
    return {};

  const defaultValues: Record<string, Partial<CardModuleSimpleTextData>> = {
    dark: SIMPLE_TEXT_DEFAULT_VALUES_DARK,
    light: SIMPLE_TEXT_DEFAULT_VALUES_LIGHT,
    primary: SIMPLE_TEXT_DEFAULT_VALUES_PRIMARY,
  };

  return defaultValues[coverBackgroundColor];
};

/**
 * The maximum length of text for the simple text module
 */
export const SIMPLE_TEXT_MAX_LENGTH = 2000;

/**
 * The minimum font size for the simple text module
 */
export const SIMPLE_TEXT_MIN_FONT_SIZE = 6;

/**
 * The maximum vertical spacing for the simple text module
 */
export const SIMPLE_TEXT_MAX_VERTICAL_SPACING = 50;

/**
 * The maximum font size for the simple text module
 */
export const SIMPLE_TEXT_MAX_FONT_SIZE = 128;

/**
 * The maximum horizontal margin for the simple text module
 */
export const SIMPLE_TEXT_MAX_HORIZONTAL_MARGIN = 100;

/**
 * The maximum vertical margin for the simple text module
 */
export const SIMPLE_TEXT_MAX_VERTICAL_MARGIN = 200;

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

export const getTitleDefaultValues = (
  coverBackgroundColor: string | null | undefined,
  data?: Pick<CardModuleSimpleTextData, 'backgroundStyle' | 'fontColor'> | null,
) => {
  if (!coverBackgroundColor || data?.backgroundStyle || data?.fontColor)
    return {};

  const defaultValues: Record<string, Partial<CardModuleSimpleTextData>> = {
    dark: SIMPLE_TEXT_DEFAULT_VALUES_DARK,
    light: SIMPLE_TEXT_DEFAULT_VALUES_LIGHT,
    primary: SIMPLE_TEXT_DEFAULT_VALUES_PRIMARY,
  };

  return defaultValues[coverBackgroundColor];
};

export const SIMPLE_TITLE_MAX_LENGTH = 300;
/**
 * The minimum font size for the simple title module
 */
export const SIMPLE_TITLE_MIN_FONT_SIZE = 6;

/**
 * The maximum font size for the simple title module
 */
export const SIMPLE_TITLE_MAX_FONT_SIZE = 128;

/**
 * The maximum vertical spacing for the simple title module
 */
export const SIMPLE_TITLE_MAX_VERTICAL_SPACING = 50;

/**
 * The maximum horizontal margin for the simple title module
 */
export const SIMPLE_TITLE_MAX_HORIZONTAL_MARGIN = 100;

/**
 * The maximum vertical margin for the simple title module
 */
export const SIMPLE_TITLE_MAX_VERTICAL_MARGIN = 200;

//#endregion

//#region SocialLinks
/**
 * Social links module kind
 */
export const MODULE_KIND_SOCIAL_LINKS = 'socialLinks';

/**
 * The data type for the social links module
 */
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

/**
 * The default values for the social links module
 */
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

export const SOCIAL_LINKS_DEFAULT_VALUES_DARK = {
  backgroundStyle: {
    backgroundColor: 'dark',
    patternColor: 'light',
  },
  iconColor: 'light',
} as const;

export const SOCIAL_LINKS_DEFAULT_VALUES_LIGHT = {
  backgroundStyle: {
    backgroundColor: 'light',
    patternColor: 'primary',
  },
  iconColor: 'primary',
} as const;

export const SOCIAL_LINKS_DEFAULT_VALUES_PRIMARY = {
  backgroundStyle: {
    backgroundColor: 'primary',
    patternColor: 'light',
  },
  iconColor: 'light',
} as const;

export const getSocialLinksDefaultColors = (
  coverBackgroundColor: string | null | undefined,
  data?: Pick<
    CardModuleSocialLinksData,
    'backgroundStyle' | 'iconColor'
  > | null,
) => {
  if (!coverBackgroundColor || data?.backgroundStyle || data?.iconColor)
    return {};

  const defaultValues: Record<string, Partial<CardModuleSocialLinksData>> = {
    dark: SOCIAL_LINKS_DEFAULT_VALUES_DARK,
    light: SOCIAL_LINKS_DEFAULT_VALUES_LIGHT,
    primary: SOCIAL_LINKS_DEFAULT_VALUES_PRIMARY,
  };

  return defaultValues[coverBackgroundColor];
};
/**
 * The maximum icon size for the social links module
 */
export const SOCIAL_LINKS_MAX_ICON_SIZE = 96;

/**
 * The minimum icon size for the social links module
 */
export const SOCIAL_LINKS_MIN_ICON_SIZE = 44;

/**
 * The maximum border width for the social links module
 */
export const SOCIAL_LINKS_MAX_BORDER_WIDTH = 6;

/**
 * The maximum margin top for the social links module
 */
export const SOCIAL_LINKS_MAX_MARGIN_TOP = 200;

/**
 * The maximum margin bottom for the social links module
 */
export const SOCIAL_LINKS_MAX_MARGIN_BOTTOM = 200;

/**
 * The maximum margin horizontal for the social links module
 */
export const SOCIAL_LINKS_MAX_MARGIN_HORIZONTAL = 100;

/**
 * The maximum column gap for the social links module
 */
export const SOCIAL_LINKS_MAX_COLUMN_GAP = 100;

//#endregion

//#region Media
export const MODULE_KIND_MEDIA = 'media';

export type CardModuleColor = {
  background: string;
  content: string;
  title: string;
  text: string;
  graphic: string;
};

// those 2 types are here to define a common way to define the V2 module
// will help to have always the same structure/attribute naming
type CardModuleCommon = {
  cardModuleColor?: CardModuleColor;
};

type CardModuleWithMedia = {
  cardModuleMedias: Array<{
    media: { id: string };
    text?: string;
    title?: string;
    link?: string;
  }>;
};
export type CardModuleMediaData = CardModuleCommon & CardModuleWithMedia;

// #endregion

//#region Media Text
export const MODULE_KIND_MEDIA_TEXT = 'mediaText';

export type CardModuleMediaTextData = CardModuleCommon & CardModuleWithMedia;

// #endregion

// #Add new module here

//#region Commons
export const MODULE_KINDS = [
  MODULE_KIND_BLOCK_TEXT,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
  MODULE_KIND_MEDIA,
  MODULE_KIND_MEDIA_TEXT,
] as const;

export const MODULES_STYLES_VALUES = {
  [MODULE_KIND_BLOCK_TEXT]: BLOCK_TEXT_STYLE_VALUES,
  [MODULE_KIND_CAROUSEL]: CAROUSEL_STYLE_VALUES,
  [MODULE_KIND_HORIZONTAL_PHOTO]: HORIZONTAL_PHOTO_STYLE_VALUES,
  [MODULE_KIND_LINE_DIVIDER]: {},
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]:
    PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
  [MODULE_KIND_SIMPLE_BUTTON]: SIMPLE_BUTTON_STYLE_VALUES,
  [MODULE_KIND_SIMPLE_TEXT]: SIMPLE_TEXT_STYLE_VALUES,
  [MODULE_KIND_SIMPLE_TITLE]: SIMPLE_TITLE_STYLE_VALUES,
  [MODULE_KIND_SOCIAL_LINKS]: {},
  [MODULE_KIND_MEDIA]: {},
  [MODULE_KIND_MEDIA_TEXT]: {},
} as const;

export const MODULES_DEFAULT_VALUES = {
  [MODULE_KIND_BLOCK_TEXT]: BLOCK_TEXT_DEFAULT_VALUES,
  [MODULE_KIND_CAROUSEL]: CAROUSEL_DEFAULT_VALUES,
  [MODULE_KIND_HORIZONTAL_PHOTO]: HORIZONTAL_PHOTO_DEFAULT_VALUES,
  [MODULE_KIND_LINE_DIVIDER]: LINE_DIVIDER_DEFAULT_VALUES,
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]:
    PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
  [MODULE_KIND_SIMPLE_BUTTON]: SIMPLE_BUTTON_DEFAULT_VALUES,
  [MODULE_KIND_SIMPLE_TEXT]: SIMPLE_TEXT_DEFAULT_VALUES,
  [MODULE_KIND_SIMPLE_TITLE]: SIMPLE_TITLE_DEFAULT_VALUES,
  [MODULE_KIND_SOCIAL_LINKS]: SOCIAL_LINKS_DEFAULT_VALUES,
  [MODULE_KIND_MEDIA]: {},
  [MODULE_KIND_MEDIA_TEXT]: {},
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
 * the max width of the module videos
 */
export const MODULE_VIDEO_MAX_WIDTH = 1920;
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
  cardStyle?: CardStyle | null | undefined;
  /**
   * A map of the module data keys to the card style keys.
   */
  styleValuesMap?: TStyleValues | null | undefined;
  /**
   * The default values for the module data.
   */
  defaultValues?: TDefaultValues;
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
    } else if (defaultValues) {
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
// #endregion

/**
 * Swap colors in a CardModuleColor object with their values in a color palette
 */
export const swapModuleColor = (
  cardModuleColor: CardModuleColor,
  colorPalette:
    | {
        primary: string;
        light: string;
        dark: string;
      }
    | null
    | undefined,
): CardModuleColor => {
  return {
    background: swapColor(cardModuleColor.background, colorPalette),
    content: swapColor(cardModuleColor.content, colorPalette),
    title: swapColor(cardModuleColor.title, colorPalette),
    text: swapColor(cardModuleColor.text, colorPalette),
    graphic: swapColor(cardModuleColor.graphic, colorPalette),
  };
};
