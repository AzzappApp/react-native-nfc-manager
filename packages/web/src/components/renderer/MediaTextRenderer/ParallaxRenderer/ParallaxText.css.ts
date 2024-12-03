import { style } from '@vanilla-extract/css';

const textItem = style({
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontSize: 34,
  lineHeight: '1.2em',
  margin: 0,
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
