import { style } from '@vanilla-extract/css';
import { vars } from '#app/theme.css';

const overlay = style({
  position: 'absolute',
  right: 0,
  left: 0,
  bottom: 0,
  opacity: 0,
  transition: 'all 450ms cubic-bezier(0.32,1,0.23,1) 0ms',
});

const openedOverlay = style([
  overlay,
  {
    position: 'fixed',
    top: 0,
    opacity: 1,
    zIndex: 5,
  },
]);

const dialog = style({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'white',
  padding: '20px',
  boxShadow: '0px -8px 8px 0px #0000001A',
  borderRadius: '16px 16px 0 0',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  rowGap: '20px',
  transform: 'translate(0,100%)',
  transition: 'all 450ms cubic-bezier(0.32,1,0.23,1) 100ms',
});

const openedDialog = style([
  dialog,
  {
    transform: 'translate(0, 0)',
  },
]);

const message = style({
  fontWeight: vars.fontWeight.regular,
  fontSize: '15px',
  lineHeight: '24px',
  textAlign: 'center',
  maxWidth: '335px',
});

const closeButton = style({
  backgroundColor: 'transparent',
  border: 'none',
  color: vars.color.grey400,
  fontWeight: vars.fontWeight.medium,
  fontSize: '14px',
});

const styles = {
  overlay,
  dialog,
  message,
  closeButton,
  openedOverlay,
  openedDialog,
};

export default styles;
