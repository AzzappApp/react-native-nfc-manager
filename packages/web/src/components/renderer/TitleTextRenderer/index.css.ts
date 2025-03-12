import { style } from '@vanilla-extract/css';

const textFontSize = 16;
const titleFontSize = 34;

const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  margin: '0 auto',
  flex: 1,
});

const section = style({
  width: 'min(100vw, 1000px)',
  display: 'flex',
});

const column = style({
  display: 'flex',
  gridTemplateColumns: '1fr',
});

const title = style({
  fontSize: titleFontSize,
  lineHeight: '1.6em',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  width: '100%',
});

const text = style({
  fontSize: textFontSize,
  lineHeight: '1.9em',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  width: '100%',
});

export default {
  container,
  text,
  title,
  section,
  column,
  textFontSize,
  titleFontSize,
};
