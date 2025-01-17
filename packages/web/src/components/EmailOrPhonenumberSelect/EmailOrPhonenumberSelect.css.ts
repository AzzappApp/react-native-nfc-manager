import { style } from '@vanilla-extract/css';
import { vars } from '#app/[userName]/theme.css';

export const selectContainer = style({
  backgroundColor: vars.color.grey50,
  marginRight: 5,
  borderRadius: 12,
});

export const openedContainer = style({
  minWidth: 250,
  height: 400,
});

export const countryCallingCode = style({
  color: vars.color.grey200,
});
