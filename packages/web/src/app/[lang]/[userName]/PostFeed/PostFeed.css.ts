import { style } from '@vanilla-extract/css';
import { MediaQuery, textSmall, vars } from '#app/theme.css';

const wrapper = style({
  width: '100%',
  height: '100%',
  backgroundColor: vars.color.white,
  overflowY: 'scroll',
  '::-webkit-scrollbar': {
    display: 'none',
    width: '0 !important',
  },
  scrollbarWidth: 'none',
});

const header = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px',
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
