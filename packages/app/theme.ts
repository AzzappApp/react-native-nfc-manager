import { StyleSheet } from 'react-native';

export const colors = {
  dark: '#45444C',
  darkGrey: '#8a8898',
  grey: '#c4c4c4',
  lightGrey: '#ECECED',
  darkWhite: '#F5F5F5',
  orange: '#FF502E',
};

export const fontFamilies = {
  normal: 'OpenSans-Regular',
  semiBold: 'OpenSans-SemiBold',
};

export const textStyles = StyleSheet.create({
  small: {
    color: colors.dark,
    fontSize: 10,
    fontFamily: fontFamilies.semiBold,
  },
  normal: {
    color: colors.dark,
    fontSize: 16,
    fontFamily: fontFamilies.normal,
  },
  title: {
    color: colors.dark,
    fontSize: 18,
    fontFamily: fontFamilies.semiBold,
  },
  button: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.dark,
  },
});
