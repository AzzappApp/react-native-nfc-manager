import { style } from '@vanilla-extract/css';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { textLarge, textMedium, textXLarge, vars } from '#app/theme.css';

const coverWrapper = style({
  position: 'relative',
  aspectRatio: `${COVER_RATIO}`,
  width: 125,
  margin: 'auto',
});

const cover = style({
  objectFit: 'cover',
  borderRadius: 20,
  boxShadow: '0px 0px 20px 0px rgba(0, 0, 0, 0.20)',
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

const footerButton = style({ marginTop: '20px', width: '100%' });

const styles = {
  coverWrapper,
  cover,
  stats,
  stat,
  statCategory,
  statValue,
  footer,
  footerTitle,
  footerText,
  footerButton,
};

export default styles;
