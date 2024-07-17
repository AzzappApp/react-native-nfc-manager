import { createTheme, style, globalStyle } from '@vanilla-extract/css';
import { DESKTOP_WIDTH } from '#helpers/devices';

export const [themeClass, vars] = createTheme({
  color: {
    grey50: '#F5F5F6',
    grey100: '#e2e1e3',
    grey200: '#c8c7ca',
    grey400: '#a1a1a5',
    grey900: '#45444c',
    green: '#0FD59E',
    black: '#0e1216',
    white: '#fff',
    transparent: 'transparent',
  },
  fontWeight: {
    extraBold: '800',
    bold: '700',
    semiBold: '600',
    medium: '500',
    regular: '400',
  },
});

export const textXLarge = style({
  fontWeight: vars.fontWeight.extraBold,
  fontSize: '20px',
  lineHeight: '25px',
});

export const textLarge = style({
  fontWeight: vars.fontWeight.bold,
  fontSize: '16px',
  lineHeight: '20px',
});

export const textLargeSemiBold = style({
  fontWeight: vars.fontWeight.semiBold,
  fontSize: '16px',
  lineHeight: '20px',
});

export const textField = style({
  fontWeight: vars.fontWeight.regular,
  fontSize: '16px',
  lineHeight: '20px',
});

export const textButton = style({
  fontWeight: vars.fontWeight.semiBold,
  fontSize: '14px',
  lineHeight: '17px',
});

export const textButtonMedium = style({
  fontWeight: vars.fontWeight.medium,
  fontSize: '14px',
  lineHeight: '17px',
});

export const textSmallBold = style({
  fontWeight: vars.fontWeight.semiBold,
  fontSize: '12px',
  lineHeight: '15px',
});

export const textSmallMedium = style({
  fontWeight: vars.fontWeight.medium,
  fontSize: '12px',
  lineHeight: '15px',
});

export const textXSmall = style({
  fontWeight: vars.fontWeight.semiBold,
  fontSize: '11px',
  lineHeight: '14px',
});

export const textXXSmall = style({
  fontWeight: vars.fontWeight.semiBold,
  fontSize: '11px',
  lineHeight: '14px',
});

export const textMedium = style({
  fontWeight: vars.fontWeight.medium,
  fontSize: '14px',
  lineHeight: '18px',
});

export const textSmall = style({
  fontWeight: vars.fontWeight.regular,
  fontSize: '12px',
  lineHeight: '15px',
});

export const textHyperLink = style({
  fontWeight: vars.fontWeight.semiBold,
  fontSize: '12px',
  lineHeight: '15px',
  textDecoration: 'underline',
});

export enum MediaQuery {
  Desktop = `screen and (min-width: ${DESKTOP_WIDTH}px)`,
  Mobile = 'screen and (max-width: 749.9px)',
  AtLeastSmallMobile = 'screen and (min-width: 640px)',
  BelowSmallMobile = 'screen and (max-width: 639.9px)',
}

globalStyle('html', {
  height: 'calc(var(--vh, 1vh) * 100)',
  vars: {
    '--vh': '1vh',
  },
});

globalStyle('body, #__next, .root', {
  minHeight: 'calc(var(--vh, 1vh) * 100)',
  margin: 0,
  padding: 0,
});

globalStyle('body', {
  color: vars.color.black,
});

globalStyle('.root', {
  display: 'flex',
  flexDirection: 'column',
});

globalStyle('.root, *, *:before, *:after', {
  boxSizing: 'border-box',
});

globalStyle(
  'input:-internal-autofill-selected, input:-webkit-autofill, input:-webkit-autofill:focus',
  {
    backgroundColor: 'none !important',
  },
);

// smart banner styles
globalStyle('.smartbanner.smartbanner--android', {
  zIndex: 10,
  background: 'white !important',
  fontFamily: 'open sans',
});

globalStyle('.smartbanner__info__title', {
  textShadow: 'none !important',
  color: 'black !important',
});

globalStyle('.smartbanner__info__author', {
  textShadow: 'none !important',
});

globalStyle('.smartbanner__info__price', {
  textShadow: 'none !important',
});

globalStyle('.smartbanner__button', {
  display: 'inline-flex',
  padding: '3px 13px',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 10,
  borderRadius: '100px !important',
  background: '#F5F5F6 !important',
  boxShadow: 'none !important',
});

globalStyle('.smartbanner__button__label', {
  background: 'none !important',
  color: '#2E81FF !important',
  fontFamily: 'Open Sans',
  fontSize: 15,
  fontStyle: 'normal',
  fontWeight: 600,
  lineHeight: 24,
});

globalStyle('.smartbanner__exit', {
  boxShadow: 'none !important',
  background: 'none !important',
});
