import { keyframes, style } from '@vanilla-extract/css';

const background = style({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0, 0, 0, 0.8)',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxSizing: 'border-box',
  overflow: 'auto',
});

const closeButton = style({
  position: 'absolute',
  transform: 'translate(-100%, -100%)',
  padding: '4px',
  cursor: 'pointer',
});

const media = style({
  maxWidth: 'min(900px, 100%)',
  maxHeight: '90vh',
  width: 'auto',
  height: 'auto',
  objectFit: 'contain',
  display: 'block',
});

const mediaContainer = style({
  position: 'relative',

  padding: '30px',
  maxWidth: 'calc(900px + 60px)',
  maxHeight: 'calc(90vw + 60px)',

  width: '100%',
  height: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const mediaWrapper = style({
  position: 'relative',
  display: 'inline-block',
});

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const fadeOut = keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

const fadeInStyle = style({
  animation: `${fadeIn} 300ms ease forwards`,
});

const fadeOutStyle = style({
  animation: `${fadeOut} 300ms ease forwards`,
  pointerEvents: 'none',
});

const styles = {
  background,
  media,
  mediaContainer,
  closeButton,
  mediaWrapper,
  fadeInStyle,
  fadeOutStyle,
};

export default styles;
