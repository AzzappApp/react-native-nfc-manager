import { style } from '@vanilla-extract/css';

const links = style({
  justifyContent: 'center',
  position: 'relative',
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
};

export default styles;
