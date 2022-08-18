import { Platform, StyleSheet } from 'react-native';
import type { TextStyle } from 'react-native';

export const colors = {
  // color from style guide
  red: '#EF3962',
  black: '#0E1216',
  grey200: '#C8C7CA',

  // other color to be replaced when styleguide is finished
  dark: '#45444C',
  darkGrey: '#8a8898',
  grey: '#c4c4c4',
  lightGrey: '#ECECED',
  darkWhite: '#F5F5F5',
  orange: '#FF502E',
  blue: '#502EFF',
};

export const fontFamilies = {
  normal: Platform.select({
    default: { fontFamily: 'OpenSans-Regular', fontWeight: 'normal' },
    web: { fontFamily: 'Open Sans, sans-serif', fontWeight: '400' },
  }) as TextStyle,
  semiBold: Platform.select({
    default: { fontFamily: 'OpenSans-SemiBold', fontWeight: 'normal' },
    web: { fontFamily: 'Open Sans, sans-serif', fontWeight: '600' },
  }) as TextStyle,
};

export const textStyles = StyleSheet.create({
  small: {
    color: colors.dark,
    fontSize: 10,
    ...fontFamilies.semiBold,
  },
  normal: {
    color: colors.dark,
    fontSize: 16,
    ...fontFamilies.normal,
  },
  title: {
    color: colors.dark,
    fontSize: 18,
    ...fontFamilies.semiBold,
  },
  button: {
    fontSize: 14,
    color: colors.dark,
    ...fontFamilies.semiBold,
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
