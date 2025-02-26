import { style } from '@vanilla-extract/css';

const textItem = style({
  textAlign: 'center',
});

const container = style({
  position: 'absolute',
  display: 'flex',
  height: '100%',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  maxWidth: '600px',
  padding: '0 20px',
  rowGap: '20px',
});

const textContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  gap: 20,
  position: 'relative',
});

const overlay = style({
  opacity: 0.2,
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

export default {
  overlay,
  textItem,
  textContainer,
  container,
};
