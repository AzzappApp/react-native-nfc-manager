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
      paddingTop: 20,
      paddingBottom: 20,
      gap: 20,
      overflow: 'hidden',
      alignItems: 'flex-start',
    },
  },
});

const sectionContainerEven = style([
  sectionContainer,
  {
    flexDirection: 'row-reverse',
  },
]);

const sectionPartContainer = style({
  width: 'min(max(100vw - 40px, 1px), 480px)',
  flex: 1,
});

const imageContainer = style({
  width: '100%',
  maxHeight: 480,
  aspectRatio: '1',
  position: 'relative',
});

const sectionTextContainer = style([
  sectionPartContainer,
  {
    display: 'flex',
    flexDirection: 'column',
    rowGap: 20,
    alignItems: 'flex-start',
  },
]);

const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});

const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 'min(100vw, 1000px)',
  padding: '0 20px',
  margin: '0 auto',
  flex: 1,
});

const media = style({
  width: '100%',
  height: '100%',
});

const link = style({
  justifyContent: 'center',
  alignItems: 'center',
  padding: '15px 20px',
  textDecoration: 'none',
  display: 'flex',
});

export default {
  container,
  sectionContainer,
  imageContainer,
  section,
  sectionContainerEven,
  sectionPartContainer,
  sectionTextContainer,
  media,
  link,
};
