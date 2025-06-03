import { style } from '@vanilla-extract/css';
import { textMedium, textXLarge } from '#app/theme.css';

const wrapper = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  alignItems: 'center',
});

const background = style({
  position: 'absolute',
  top: 0,
  left: 0,
  objectFit: 'contain',
  objectPosition: 'top',
  width: '100%',
});

const message = style({
  marginLeft: 20,
  marginRight: 20,
  maxWidth: 325,
  marginTop: '23%',
  zIndex: 1,
});

const title = style([{ textAlign: 'center', margin: 0 }, textXLarge]);

const description = style([{ textAlign: 'center', marginTop: 20 }, textMedium]);

const logo = style({
  height: 20,
  width: 96,
});

const logoWrapper = style({
  position: 'absolute',
  bottom: 40,
  left: 'calc(50% - 48px)',
});

const styles = {
  wrapper,
  background,
  message,
  title,
  description,
  logoWrapper,
  logo,
};

export default styles;
