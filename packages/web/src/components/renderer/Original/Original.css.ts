import { style } from '@vanilla-extract/css';

const moduleContainer = style({
  overflow: 'hidden',
  paddingInline: '20px',
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
});

const originalContainer = style({
  width: '100%',
});

const originalLayer = style({
  height: '100%',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
});

const originalItem = style({
  width: '100%',
  height: '100%',
});

export default {
  originalLayer,
  originalContainer,
  originalItem,
  moduleContainer,
};
