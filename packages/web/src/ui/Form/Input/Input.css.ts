import { style } from '@vanilla-extract/css';
import { textField, vars } from '#app/[userName]/theme.css';
import { INPUT_PADDING_HORIZONTAL } from '../FormInput/FormInput.css';

export const inputContainer = style({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  gap: 5,
  border: 'none',
});

export const containerWithPrefix = style([
  textField,
  {
    display: 'flex',
    alignItems: 'center',
  },
]);

export const prefixSpan = style({
  color: vars.color.grey400,
  padding: `0px ${INPUT_PADDING_HORIZONTAL}px`,
});
