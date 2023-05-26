export type ModuleKind =
  | 'blockText'
  | 'carousel'
  | 'horizontalPhoto'
  | 'lineDivider'
  | 'openingHours'
  | 'photoWithTextAndTitle'
  | 'simpleButton'
  | 'simpleText'
  | 'simpleTitle'
  | 'socialLinks'
  | 'webCardsCarousel';

export const MODULE_KIND_BLOCK_TEXT = 'blockText';

export const MODULE_KIND_CAROUSEL = 'carousel';

export const MODULE_KIND_HORIZONTAL_PHOTO = 'horizontalPhoto';

export const MODULE_KIND_LINE_DIVIDER = 'lineDivider';

export const MODULE_KIND_OPENING_HOURS = 'openingHours';

export const MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE = 'photoWithTextAndTitle';

export const MODULE_KIND_SIMPLE_BUTTON = 'simpleButton';

export const MODULE_KIND_SIMPLE_TEXT = 'simpleText';

export const MODULE_KIND_SIMPLE_TITLE = 'simpleTitle';

export const MODULE_KIND_SOCIAL_LINKS = 'socialLinks';

export const MODULE_KIND_WEB_CARDS_CAROUSEL = 'webCardsCarousel';

export const MODULE_KINDS: ModuleKind[] = [
  'blockText',
  'carousel',
  'horizontalPhoto',
  'lineDivider',
  'openingHours',
  'photoWithTextAndTitle',
  'simpleButton',
  'simpleText',
  'simpleTitle',
  'socialLinks',
  'webCardsCarousel',
];

export const SIMPLE_TEXT_DEFAULT_VALUES = {
  fontFamily: 'Arial',
  fontSize: 12,
  color: '#000000',
  textAlign: 'left',
  verticalSpacing: 0,
  marginHorizontal: 10,
  marginVertical: 10,
} as const;

export const SIMPLE_TEXT_MAX_LENGTH = 2000;

export const SIMPLE_TITLE_DEFAULT_VALUES = {
  fontFamily: 'Arial',
  fontSize: 18,
  color: '#000000',
  textAlign: 'center',
  verticalSpacing: 0,
  marginHorizontal: 10,
  marginVertical: 20,
} as const;

export const SIMPLE_TITLE_MAX_LENGTH = 500;

export const LINE_DIVIDER_DEFAULT_VALUES = {
  orientation: 'bottomRight',
  marginBottom: 0,
  marginTop: 0,
  height: 100,
  colorTop: '#FFFFFF',
  colorBottom: '#000000', // use theme colors(not important from azzapp/app here)
} as const;
