import { style } from '@vanilla-extract/css';
import { vars } from '#app/theme.css';

const buttonIcon = style({
  backgroundColor: vars.color.transparent,
  borderWidth: 0,
  padding: 0,
  cursor: 'pointer',
});

const styles = {
  buttonIcon,
};

export default styles;
