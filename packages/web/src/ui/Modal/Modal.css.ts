import { style, keyframes } from '@vanilla-extract/css';
import { convertHexToRGBA } from '@azzapp/shared/colorsHelpers';
import { vars } from '#app/[userName]/theme.css';

const slideUp = keyframes({
  '0%': { transform: 'translateY(100%)' },
  '100%': { transform: 'translateY(0)' },
});

const slideDown = keyframes({
  '0%': { transform: 'translateY(0)' },
  '100%': { transform: 'translateY(100%)' },
});

const wrapper = style({
  position: 'fixed',
  top: 0,
  width: '100vw',
  height: '100%',
  backgroundColor: convertHexToRGBA('#000000', 70),
  zIndex: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  transition: `opacity 0.3s ease-out`,
  opacity: 1,
});

const wrapperClosing = style({
  transition: `opacity 0.3s ease-in`,
  opacity: 0,
});

const modal = style({
  position: 'relative',
  paddingTop: '20px',
  paddingBottom: '20px',
  borderRadius: '24px',
  backgroundColor: vars.color.white,
  width: '375px',
  maxWidth: '100%',
  maxHeight: '100%',
  boxShadow: '0px 1px 25px 0px rgba(0, 0, 0, 0.45)',
  animation: `${slideUp} 0.3s ease-out`,
  display: 'flex',
  flexDirection: 'column',
});

const modalContent = style({
  width: '100%',
  height: '100%',
  overflow: 'auto',
  '::-webkit-scrollbar': {
    width: 5,
  },
  scrollbarWidth: 'thin',
});

const modalClosing = style({
  animation: `${slideDown} 0.3s ease-in`,
});

const close = style({
  position: 'absolute',
  top: '20px',
  right: '20px',
});

const styles = {
  wrapper,
  wrapperClosing,
  modal,
  modalContent,
  modalClosing,
  close,
};

export default styles;
