import { style } from '@vanilla-extract/css';
import { textMedium, vars } from '#app/theme.css';

const input = style([
  textMedium,
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
