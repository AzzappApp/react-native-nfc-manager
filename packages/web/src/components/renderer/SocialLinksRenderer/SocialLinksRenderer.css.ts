import { style } from '@vanilla-extract/css';

const links = style({
  justifyContent: 'center',
  position: 'relative',
  marginLeft: 'auto',
  marginRight: 'auto',
});

const linksInlineWrapper = style({
  width: '100%',
  overflowX: 'scroll',
  '::-webkit-scrollbar': {
    display: 'none',
    width: '0 !important',
  },
  scrollbarWidth: 'none',
});

const linksInline = style({
  width: 'max-content',
  display: 'flex',
  flexGrow: '1',
});

const linksBlock = style({
  display: 'flex',
  flexWrap: 'wrap',
  flexDirection: 'row',
  width: '100%',
});

const styles = {
  links,
  linksInline,
  linksBlock,
  linksInlineWrapper,
};

export default styles;
