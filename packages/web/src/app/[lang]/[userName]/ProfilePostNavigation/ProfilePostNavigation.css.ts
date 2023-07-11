import { style } from '@vanilla-extract/css';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { textLarge, textXXSmall } from '#app/theme.css';

const navigation = style({
  width: '60px',
  padding: '10px 5px',
  backgroundColor: 'white',
  borderRadius: '90px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const postsCountWrapper = style({
  width: '44px',
  overflowX: 'scroll',
  overflowY: 'hidden',
  '::-webkit-scrollbar': {
    display: 'none',
    width: '0 !important',
  },
  scrollbarWidth: 'none',
});

const postsCountContent = style({
  width: '80px',
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0 12px',
});

const postsCount = style([textLarge, { textAlign: 'center', width: '21px' }]);

const open = style({
  width: '24px',
  height: '24px',
  // marginLeft: '24px',
});

const openIcon = style({
  transform: 'rotate(180deg)',
});

const text = style([textXXSmall, { textAlign: 'center' }]);

const coverContainer = style({
  margin: '10px 0',
  width: '40px',
  position: 'relative',
  aspectRatio: `${COVER_RATIO}`,
  cursor: 'pointer',
  border: 'none',
  backgroundColor: 'transparent',
});

const cover = style({
  objectFit: 'cover',
  borderRadius: 20,
});

const clickable = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
});

const postsWrapper = style({
  border: 'none',
  backgroundColor: 'transparent',
});

const styles = {
  navigation,
  postsCountWrapper,
  postsCountContent,
  postsCount,
  open,
  openIcon,
  text,
  coverContainer,
  cover,
  clickable,
  postsWrapper,
};

export default styles;
