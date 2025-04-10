import { style } from '@vanilla-extract/css';

const container = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  maxWidth: 'min(100vw, 1000px)',
  margin: '0 auto',
});

const item = style({
  overflow: 'hidden',
});

const column = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
});

const image = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  top: 0,
  left: 0,
  touchAction: 'none' /* Prevents zoom gestures */,
  pointerEvents: 'none' /* Disables pointer interaction */,
  transform: 'scale(1)',
  transition: 'transform 1s ease-in-out',

  selectors: {
    [`${item}:hover &`]: {
      transform: 'scale(1.2)',
      transition: 'transform 1s ease-in-out',
    },
  },
});

export default {
  container,
  image,
  column,
  item,
};
