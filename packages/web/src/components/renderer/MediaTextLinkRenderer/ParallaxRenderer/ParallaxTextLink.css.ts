import { style } from '@vanilla-extract/css';

const textItem = style({
  lineHeight: '1.2em',
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
});

export default {
  textItem,
  textContainer,
  container,
};
