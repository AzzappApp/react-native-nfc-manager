import { style } from '@vanilla-extract/css';

const titleFontSize = 34;
const textFontSize = 16;

const title = style({
  fontSize: titleFontSize,
  fontWeight: 700,
  lineHeight: '1.6em',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

const text = style({
  fontSize: textFontSize,
  lineHeight: '1.9em',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

const link = style({
  justifyContent: 'center',
  alignItems: 'center',
  padding: '15px 20px',
  textDecoration: 'none',
  lineHeight: '1.2em',
  display: 'flex',
  minWidth: 150,
});

export default {
  title,
  text,
  link,
  textFontSize,
  titleFontSize,
};
