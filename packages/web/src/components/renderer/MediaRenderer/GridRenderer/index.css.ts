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
});

export default {
  container,
  image,
  column,
  item,
};
