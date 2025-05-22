import { style } from '@vanilla-extract/css';
import { textField, textFieldError, vars } from '#app/[userName]/theme.css';

export const INPUT_HEIGHT = 47;
export const INPUT_PADDING_HORIZONTAL = 5;

const input = style([
  textField,
  {
    height: INPUT_HEIGHT,
    backgroundColor: vars.color.grey50,
    padding: '0px 15px',
    borderRadius: '12px',
    border: 'none',
    outline: 'none',
  },
]);

const inputWithLabel = style({
  display: 'flex',
  flexDirection: 'column',
});

const inputOnError = style({
  border: `1px solid ${vars.color.error}`,
  ':focus': {
    border: `1px solid ${vars.color.error}`,
  },
});

const inputOnWarning = style({
  borderWidth: 0,
  borderBottom: `1px solid ${vars.color.warn}`,
  ':focus': {
    borderBottom: `1px solid ${vars.color.warn}`,
  },
});

const inputError = style([textFieldError, { color: vars.color.error }]);

const styles = {
  input,
  inputWithLabel,
  inputOnError,
  inputOnWarning,
  inputError,
};

export default styles;
