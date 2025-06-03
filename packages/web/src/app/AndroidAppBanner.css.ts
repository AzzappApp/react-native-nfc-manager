import { style } from '@vanilla-extract/css';
import { vars } from './theme.css';

const container = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 10,
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  textAlign: 'center',
  zIndex: 10,
  borderBottom: '1px solid #ccc',
  boxShadow: '0 1px 5px rgba(0, 0, 0, 0.1)',
  background: '#f7f7f7',
  gap: 6,
  transition: 'all 0.3s ease-out',
});

const content = style({
  fontWeight: vars.fontWeight.medium,
  fontSize: 12,
  color: vars.color.grey900,
  lineHeight: 'normal',
});

const icon = style({
  width: 35,
  height: 35,
  marginLeft: 10,
});

const close = style({
  position: 'absolute',
  top: 5,
  left: 5,
  width: 30,
  height: 30,
});

export default {
  container,
  content,
  icon,
  close,
};
