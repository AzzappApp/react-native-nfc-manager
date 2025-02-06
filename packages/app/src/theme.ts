import { Platform, StyleSheet } from 'react-native';

// color from style guide
export const colors = {
  //primary
  primary100: '#FFA08D',
  primary400: '#FF502E', //default
  // brightblue
  brightblue50: '#C0EEFD',
  brightblue100: '#84DAF5',
  brightblue200: '#4FC8EE',
  brightblue300: '#4FC8EE',
  brightblue400: '#2FB5DF', // default
  brightblue700: '#097294',
  //darkblue
  darkblue50: '#D3D6F1',
  darkblue700: '#24309E',
  //red
  red400: '#FF2E54',
  warn: 'rgba(255,46,84,0.3)',
  //grey
  grey50: '#F5F5F6',
  grey100: '#E2E1E3',
  grey200: '#C8C7CA',
  grey300: '#B5B4B8',
  grey400: '#A1A1A5',
  grey500: '#87878E',
  grey600: '#727179',
  grey700: '#67676E',
  grey800: '#54535B',
  grey900: '#45444C',
  grey1000: '#2C2B32',

  //color that should be deleted
  white: '#FFFFFF',
  black: '#0E1216',
  green: '#0FD59E',
};
export const fontFamilies = {
  extrabold: { fontFamily: 'PlusJakartaSans-ExtraBold' },
  bold: { fontFamily: 'PlusJakartaSans-Bold' },
  semibold: { fontFamily: 'PlusJakartaSans-SemiBold' },
  medium: { fontFamily: 'PlusJakartaSans-Medium' },
  regular: { fontFamily: 'PlusJakartaSans-Regular' },
  azzapp: { fontFamily: 'Azzapp' },
} as const;

export const textStyles = StyleSheet.create({
  xlarge: {
    ...fontFamilies.extrabold,
    fontSize: 20,
    lineHeight: 25,
  },
  large: { ...fontFamilies.bold, fontSize: 16, lineHeight: 20 },
  textField: { ...fontFamilies.regular, fontSize: 16, lineHeight: 20 },
  button: { ...fontFamilies.semibold, fontSize: 14, lineHeight: 17 },
  xsmallbold: {
    ...fontFamilies.semibold,
    fontSize: 9,
    lineHeight: 11.3,
  },
  smallbold: { ...fontFamilies.semibold, fontSize: 12, lineHeight: 15 },
  xsmall: { ...fontFamilies.semibold, fontSize: 11, lineHeight: 14 },
  xxsmallextrabold: {
    ...fontFamilies.extrabold,
    fontSize: 11,
    lineHeight: 12.6,
  },
  medium: { ...fontFamilies.medium, fontSize: 14, lineHeight: 18 },
  small: { ...fontFamilies.regular, fontSize: 12, lineHeight: 15 },
  hyperLink: {
    ...fontFamilies.medium,
    fontSize: 14,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  azzapp: {
    ...fontFamilies.azzapp,
  },
});

export const mixins = {
  absoluteFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
} as const;

export const shadow = (
  appearence: 'dark' | 'light',
  direction: 'bottom' | 'center' | 'top' = 'bottom',
  // @see https://github.com/facebook/react-native/issues/49128
  forceOldShadow = Platform.OS === 'ios',
) =>
  forceOldShadow
    ? {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height:
            direction === 'bottom' ? 10 : direction === 'center' ? 0 : -10,
        },
        shadowOpacity: appearence === 'dark' ? 0.4 : 0.2,
        shadowRadius: 10,
        elevation: 10,
      }
    : {
        boxShadow: [
          {
            offsetX: 0,
            offsetY:
              direction === 'bottom' ? 10 : direction === 'center' ? 0 : -10,
            blurRadius: '20',
            spreadDistance: '0',
            color: `rgba(0, 0, 0, ${appearence === 'dark' ? 0.4 : 0.2})`,
          },
        ],
      };
