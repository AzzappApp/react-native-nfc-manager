import { style } from '@vanilla-extract/css';

const link = style({
  overflow: 'hidden',
  textDecoration: 'none',
  borderStyle: 'solid',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const label = style({
  flexWrap: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  wordBreak: 'break-word',
  width: '100%',
  textAlign: 'center',
});

const styles = {
  link,
  label,
};

export default styles;
