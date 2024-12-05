import { style } from '@vanilla-extract/css';
import { MediaQuery } from '#app/[userName]/theme.css';

const sectionContainer = style({
  display: 'flex',
  width: '100%',
  gap: 40,
  alignItems: 'center',
  paddingTop: 40,
  paddingBottom: 40,
  '@media': {
    [MediaQuery.Mobile]: {
      flexDirection: 'column',
      padding: 20,
      gap: 20,
      overflow: 'hidden',
    },
  },
});

const sectionContainerEven = style([
  sectionContainer,
  {
    flexDirection: 'row-reverse',
  },
]);

const sectionTextContainer = style({
  flexGrow: 1,
  rowGap: 20,
  display: 'flex',
  flexDirection: 'column',
});

const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 'min(100vw, 1000px)',
  margin: '0 auto',
  flexGrow: 1,
});

const image = style({
  borderRadius: 20,
  maxWidth: 'min(max(100vw - 40px, 1px), 480px)',
  width: '100%',
  height: '100%',
});

export default {
  container,
  sectionContainer,
  sectionContainerEven,
  sectionTextContainer,
  image,
};
