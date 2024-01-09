import { style } from '@vanilla-extract/css';
import { MediaQuery, textSmall, vars } from '#app/[userName]/theme.css';

const wrapper = style({
  width: '100%',
  height: '100vh',
  backgroundColor: vars.color.white,
  overflowY: 'scroll',
  '::-webkit-scrollbar': {
    display: 'none',
    width: '0 !important',
  },
  scrollbarWidth: 'none',
  position: 'relative',
  paddingTop: '96px',
});

const header = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px',
  position: 'fixed',
  top: 0,
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
  backgroundColor: vars.color.white,
});

const close = style({
  '@media': {
    [MediaQuery.Mobile]: {
      visibility: 'hidden',
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
});

const headerPostsCount = style([textSmall, { color: vars.color.grey200 }]);

const headerButton = style({ marginTop: '5px' });

const styles = {
  wrapper,
  header,
  close,
  headerData,
  headerName,
  headerPostsCount,
  headerButton,
};

export default styles;
