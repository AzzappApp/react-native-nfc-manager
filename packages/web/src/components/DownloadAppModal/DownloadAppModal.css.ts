import { style } from '@vanilla-extract/css';
import { textLarge, textMedium, textXLarge, vars } from '#app/theme.css';

const coverWrapper = style({
  margin: 'auto',
  overflow: 'visible',
});

const stats = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-evenly',
  marginTop: '30px',
  borderBottomColor: vars.color.grey100,
  borderBottomStyle: 'solid',
  borderBottomWidth: '1px',
  paddingBottom: '10px',
  padding: '20px',
});

const stat = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const statCategory = style([textMedium, { color: vars.color.grey400 }]);

const statValue = style([textXLarge, {}]);

const footer = style({
  display: 'flex',
  flexDirection: 'column',
  paddingLeft: '20px',
  paddingRight: '20px',
  alignItems: 'center',
});

const footerTitle = style([
  textLarge,
  {
    marginTop: '20px',
  },
]);

const footerText = style([textMedium, { marginTop: '10px' }]);

const footerButton = style({ marginTop: '20px', width: '100%', height: 47 });

const footerButtons = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-evenly',
  width: '100%',
  columnGap: 10,
});

const styles = {
  coverWrapper,
  stats,
  stat,
  statCategory,
  statValue,
  footer,
  footerTitle,
  footerText,
  footerButton,
  footerButtons,
};

export default styles;
