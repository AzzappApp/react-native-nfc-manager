import { style } from '@vanilla-extract/css';
import { vars } from '#app/[userName]/theme.css';

const footer = style({
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
  alignItems: 'center',
  gap: 20,
  padding: '30px 10px 80px 10px',
});

const poweredByContainer = style({
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
  alignItems: 'center',
  gap: 10,
});

const poweredByContainerAzzappPlus = style([
  poweredByContainer,
  {
    flexDirection: 'row',
    gap: 5,
  },
]);

const poweredByLabel = style({
  fontWeight: vars.fontWeight.regular,
  fontSize: '12px',
  lineHeight: 'normal',
});

const storeContainer = style({
  display: 'flex',
  gap: 5,
});

const azzapLink = style({
  textDecoration: 'none',
  fontSize: '12px',
  lineHeight: 'normal',
  letterSpacing: 1.2,
  textDecorationLine: 'underline',
  textDecorationStyle: 'solid',
  textDecorationSkipInk: 'none',
  textDecorationThickness: 'auto',
  textUnderlineOffset: 'auto',
  textUnderlinePosition: 'from-font',
});

const styles = {
  footer,
  poweredByContainer,
  poweredByContainerAzzappPlus,
  poweredByLabel,
  storeContainer,
  azzapLink,
};

export default styles;
