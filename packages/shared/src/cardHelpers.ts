import { typedEntries } from './objectHelpers';

// #region Color Palette
/**
 * A triptych of colors used to style a card
 */
export type ColorPalette = {
  primary: string;
  light: string;
  dark: string;
};
/**
 * The list of possible colors name in a color palette
 */
export const COLOR_PALETTE_COLORS = ['primary', 'light', 'dark'] as const;

/**
 * An enum representing list of possible colors in a color palette
 */
export type ColorPaletteColor = 'dark' | 'light' | 'primary';

/**
 * The default color palette used to style a card
 */
export const DEFAULT_COLOR_PALETTE = {
  primary: '#FF2E54',
  light: '#FFFFFF',
  dark: '#000000',
};

/**
 * A default list of colors that will be assigned to user `otherColors`
 */
export const DEFAULT_COLOR_LIST = ['#FFFFFF', '#000000'];

/**
 * Swap a color name with its value in a color palette if the value is a color name
 * return the given color otherwise
 */
export const swapColor = <T extends string | null | undefined>(
  color: T,
  colorPalette:
    | {
        primary: string;
        light: string;
        dark: string;
      }
    | null
    | undefined,
): T | string => {
  'worklet';
  if (!colorPalette) {
    colorPalette = DEFAULT_COLOR_PALETTE;
  }
  switch (color) {
    case 'primary':
      return colorPalette.primary;
    case 'light':
      return colorPalette.light;
    case 'dark':
      return colorPalette.dark;
    default:
      return color;
  }
};

// #endregion

// #region Card Style

/**
 * A list of style used by a card modules
 */
export type CardTemplateType = {
  id: string | null;
  label: string | null;
} | null;

// #endregion

// #region Card Style

/**
 * A list of style used by a card modules
 */
export type CardStyle = {
  borderColor: string;
  borderRadius: number;
  borderWidth: number;
  buttonColor: string;
  buttonRadius: number;
  fontFamily: string;
  fontSize: number;
  gap: number;
  titleFontFamily: string;
  titleFontSize: number;
};

/**
 * The default style used by card modules
 */
export const DEFAULT_CARD_STYLE: CardStyle = {
  borderColor: '#000000',
  borderRadius: 0,
  borderWidth: 0,
  buttonColor: '#000000',
  buttonRadius: 0,
  fontFamily: 'Inter_Regular',
  fontSize: 16,
  gap: 0,
  titleFontFamily: 'Inter_Regular',
  titleFontSize: 34,
};

/**
 * And helpers function replace the value of an object with the value of the associated key in a card style
 */
export const getValuesFromStyle = <T extends Record<any, keyof CardStyle>>(
  cardStyle: CardStyle | null | undefined,
  values: T | null | undefined,
): {
  [key in keyof T]: CardStyle[T[key]];
} => {
  const style = cardStyle ?? DEFAULT_CARD_STYLE;
  if (!values) {
    return {} as any;
  }
  return typedEntries(values).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: style[value],
    }),
    {},
  ) as {
    [key in keyof T]: CardStyle[T[key]];
  };
};
// #endregion
