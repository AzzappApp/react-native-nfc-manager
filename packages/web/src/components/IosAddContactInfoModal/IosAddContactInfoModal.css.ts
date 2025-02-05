import { style } from '@vanilla-extract/css';
import { textLargeSemiBold, textMedium, vars } from '#app/[userName]/theme.css';

const bottomContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'center',
  marginTop: 20,
});

const title = style([textLargeSemiBold]);
const subtitle = style([textMedium]);

const buttonLink = style({
  backgroundColor: vars.color.grey1000,
  borderRadius: 45,
  border: `2px solid ${vars.color.black}`,
  boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.20)',
  marginTop: 10,
  marginBottom: 25,
});

const styles = {
  bottomContainer,
  title,
  subtitle,
  buttonLink,
};

export default styles;
