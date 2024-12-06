import { style } from '@vanilla-extract/css';

const title = style({
  fontSize: 34,
  fontWeight: 700,
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

const text = style({
  fontSize: 16,
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

export default {
  title,
  text,
};
