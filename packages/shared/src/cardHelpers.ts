import { typedEntries } from './objectHelpers';

export type ColorPalette = {
  primary: string;
  light: string;
  dark: string;
};
export const COLOR_PALETTE_COLORS = ['primary', 'light', 'dark'] as const;

export type ColorPaletteColor = 'dark' | 'light' | 'primary';

export const CARD_DEFAULT_BACKGROUND_COLOR = '#FFFFFF';

export const DEFAULT_COLOR_PALETTE = {
  primary: '#000000',
  light: '#FFFFFF',
  dark: '#000000',
};

export const DEFAULT_COLOR_LIST = [
  '#FFFFFF',
  '#000000',
  '#68C4C9',
  '#EBCC60',
  '#F3A1B0',
  '#B0C0F8',
  '#C8F491',
];

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

export const DEFAULT_CARD_STYLE: CardStyle = {
  borderColor: '#000000',
  borderRadius: 0,
  borderWidth: 0,
  buttonColor: '#000000',
  buttonRadius: 0,
  fontFamily: 'Inter_Regular',
  fontSize: 12,
  gap: 0,
  titleFontFamily: 'Inter_Regular',
  titleFontSize: 18,
};

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
