import { style } from '@vanilla-extract/css';
import { colors } from '@azzapp/shared/colorsHelpers';
import { MediaQuery, textSmall, vars } from '#app/[userName]/theme.css';

const wrapper = style({
  width: '100%',
  height: '100vh',
  overflowY: 'scroll',
  '::-webkit-scrollbar': {
    display: 'none',
    width: '0 !important',
  },
  scrollbarWidth: 'none',
  position: 'relative',
});

const header = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px',
  height: '96px',
  '@media': {
    [MediaQuery.Desktop]: {
      width: '300px',
    },
    [MediaQuery.Mobile]: {
      width: '100%',
    },
  },
  zIndex: 1,
});

const close = style({
  '@media': {
    [MediaQuery.Mobile]: {
      visibility: 'hidden',
    },
  },
});

const share = style({
  '@media': {
    [MediaQuery.Mobile]: {
      color: `${vars.color.black}!important`,
    },
  },
});

const headerData = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const headerName = style({
  fontWeight: vars.fontWeight.bold,
  textDecoration: 'none',
  '@media': {
    [MediaQuery.Mobile]: {
      color: `${vars.color.black}!important`,
    },
  },
});

const headerPostsCount = style([textSmall, { color: vars.color.grey200 }]);

const headerButton = style({ marginTop: '5px' });

const headerButtonLight = style({
  color: colors.white,
  borderWidth: 1,
  borderColor: colors.white,
  borderStyle: 'solid',
});

const posts = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  '@media': {
    [MediaQuery.Desktop]: {
      gap: '20px',
    },
  },
});

const styles = {
  wrapper,
  header,
  close,
  share,
  headerData,
  headerName,
  headerPostsCount,
  headerButton,
  headerButtonLight,
  posts,
};

export default styles;
