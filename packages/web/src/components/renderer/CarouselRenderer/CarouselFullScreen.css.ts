import { style } from '@vanilla-extract/css';
import { convertHexToRGBA } from '#helpers';
import { MediaQuery, vars } from '#app/theme.css';

const wrapper = style({
  position: 'fixed',
  top: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: convertHexToRGBA('#000000', 50),
  zIndex: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
});

const content = style({
  width: '90%',
  height: '90%',
  margin: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const button = style({
  position: 'absolute',
  top: 'calc(50% - 18px)',
  cursor: 'pointer',
  backgroundColor: vars.color.grey50,
  borderRadius: '36px',
  width: '36px',
  height: '36px',
});

const buttonRight = style({
  '@media': {
    [MediaQuery.Desktop]: {
      right: 10,
    },
    [MediaQuery.Mobile]: {
      right: 0,
    },
  },
});

const buttonLeft = style({
  '@media': {
    [MediaQuery.Desktop]: {
      left: 10,
    },
    [MediaQuery.Mobile]: {
      left: 0,
    },
  },
});

const styles = {
  wrapper,
  content,
  button,
  buttonRight,
  buttonLeft,
};

export default styles;
