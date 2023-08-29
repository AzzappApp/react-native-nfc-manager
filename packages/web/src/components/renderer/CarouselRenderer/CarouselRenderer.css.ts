import { style } from '@vanilla-extract/css';

const content = style({
  msOverflowStyle: 'none' /* IE and Edge */,
  scrollbarWidth: 'none' /* Firefox */,
  '::-webkit-scrollbar': {
    display: 'none',
    width: '0 !important',
  },
  zIndex: 1,
});

const styles = {
  content,
};

export default styles;
