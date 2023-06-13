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
  fontSize: 20,
  color: '#000000',
  textAlign: 'center',
  verticalSpacing: 0,
  marginHorizontal: 10,
  marginVertical: 20,
} as const;

export const SIMPLE_TITLE_MAX_LENGTH = 300;

export const LINE_DIVIDER_DEFAULT_VALUES = {
  orientation: 'bottomRight',
  marginBottom: 0,
  marginTop: 0,
  height: 100,
  colorTop: '#FFFFFF',
  colorBottom: '#000000', // use theme colors(not important from azzapp/app here)
} as const;

export const HORIZONTAL_PHOTO_DEFAULT_VALUES = {
  borderWidth: 0,
  borderRadius: 1,
  borderColor: '#000000',
  marginHorizontal: 0,
  marginVertical: 0,
  height: 200,
} as const;

export const CAROUSEL_DEFAULT_VALUES = {
  borderSize: 0,
  borderColor: '#000000',
  borderRadius: 0,
  marginVertical: 0,
  marginHorizontal: 0,
  gap: 10,
  imageHeight: 400,
  squareRatio: false,
} as const;

export const CAROUSEL_IMAGE_MAX_WIDTH = 2048;

export const SIMPLE_BUTTON_DEFAULT_VALUES = {
  buttonLabel: '',
  actionType: 'email',
  actionLink: '',
  fontFamily: 'Arial',
  fontColor: '#FFFFFF',
  fontSize: 14,
  buttonColor: '#000000',
  borderColor: '#000000',
  borderWidth: 5,
  borderRadius: 5,
  marginTop: 0,
  marginBottom: 0,
  width: 150,
  height: 50,
} as const;

export const PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES = {
  fontFamily: 'Arial',
  fontColor: '#000000',
  textAlign: 'left',
  imageMargin: 'width_full',
  verticalArrangement: 'top',
  horizontalArrangement: 'left',
  gap: 10,
  fontSize: 20,
  textSize: 14,
  borderRadius: 0,
  marginHorizontal: 10,
  marginVertical: 0,
  aspectRatio: 1,
  verticalSpacing: 1,
  text: '',
  title: '',
} as const;

export const SOCIAL_LINKS_DEFAULT_VALUES = {
  links: [],
  iconColor: '#000000',
  arrangement: 'inline',
  iconSize: 40,
  borderWidth: 2,
  columnGap: 15,
  marginTop: 20,
  marginBottom: 20,
} as const;

export const BLOCK_TEXT_DEFAULT_VALUES = {
  fontFamily: 'Arial',
  fontColor: '#000000',
  textAlign: 'left',
  fontSize: 14,
  verticalSpacing: 1,
  textMarginHorizontal: 20,
  textMarginVertical: 20,
  marginHorizontal: 20,
  marginVertical: 20,
  text: '',
} as const;
