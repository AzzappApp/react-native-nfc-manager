import { style } from '@vanilla-extract/css';
import { textField, vars } from '#app/[userName]/theme.css';

const input = style([
  textField,
  {
    height: '47px',
    backgroundColor: vars.color.grey50,
    padding: '0px 15px',
    borderRadius: '12px',
    border: 'none',
    outline: 'none',
  },
]);

const styles = {
  input,
};

export default styles;
