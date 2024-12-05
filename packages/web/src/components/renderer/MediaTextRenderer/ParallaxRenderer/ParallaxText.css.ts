import { style } from '@vanilla-extract/css';

const textItem = style({
  lineHeight: '1.2em',
});

const textContainer = style({
  position: 'absolute',
  display: 'flex',
  height: '100%',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
});

export default {
  textItem,
  textContainer,
};
