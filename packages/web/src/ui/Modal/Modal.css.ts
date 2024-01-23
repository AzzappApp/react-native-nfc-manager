import { style } from '@vanilla-extract/css';
import { convertHexToRGBA } from '#helpers';
import { vars } from '#app/[userName]/theme.css';

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

const modal = style({
  position: 'relative',
  paddingTop: '20px',
  paddingBottom: '20px',
  borderRadius: '20px',
  backgroundColor: vars.color.white,
  width: '375px',
  maxWidth: '100%',
});

const close = style({
  position: 'absolute',
  top: '20px',
  left: '20px',
});

const styles = {
  wrapper,
  modal,
  close,
};

export default styles;
