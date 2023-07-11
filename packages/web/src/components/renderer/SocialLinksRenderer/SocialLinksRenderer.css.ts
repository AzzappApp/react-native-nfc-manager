import { style } from '@vanilla-extract/css';

const links = style({
  width: '100%',
  justifyContent: 'center',
  position: 'relative',
});

const linksInline = style({
  overflowX: 'auto',
  display: 'flex',
  flexGrow: '1',
  flexWrap: 'wrap',
});

const linksBlock = style({
  flexWrap: 'wrap',
  flexDirection: 'row',
});

const styles = {
  links,
  linksInline,
  linksBlock,
};

export default styles;
