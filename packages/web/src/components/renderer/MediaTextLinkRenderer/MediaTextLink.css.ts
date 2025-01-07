import { style } from '@vanilla-extract/css';

const title = style({
  fontSize: 34,
  fontWeight: 700,
  lineHeight: '1.6em',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

const text = style({
  fontSize: 16,
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
};
