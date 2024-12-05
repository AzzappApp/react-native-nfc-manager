import { style } from '@vanilla-extract/css';

const title = style({
  fontSize: 34,
  fontWeight: 700,
  margin: 0,
});

const text = style({
  fontSize: 16,
  margin: 0,
});

export default {
  title,
  text,
};
