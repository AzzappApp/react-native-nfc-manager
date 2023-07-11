import { style } from '@vanilla-extract/css';
import { textSmallBold, vars } from '#app/theme.css';

const button = style([
  textSmallBold,
  {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    lineHeight: '18px',
    textDecoration: 'none',
  },
]);

const primary = style({
  backgroundColor: vars.color.black,
  color: vars.color.white,
  borderWidth: 0,
  ':active': {
    backgroundColor: vars.color.grey900,
  },
});

const primaryDisabled = style({
  backgroundColor: vars.color.grey200,
  color: vars.color.white,
  borderWidth: 0,
});

const small = style({
  padding: '8px 16px 9px 16px',
});

const medium = style({
  padding: '14px 20px 15px 20px',
});

const large = style({
  padding: '20px 24px 21px 24px',
});

const styles = {
  button,
  primary,
  primaryDisabled,
  small,
  medium,
  large,
};

export default styles;
