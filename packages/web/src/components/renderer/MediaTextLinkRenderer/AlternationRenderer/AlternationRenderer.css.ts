import { style } from '@vanilla-extract/css';
import { MediaQuery } from '#app/theme.css';

const sectionContainer = style({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
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

const sectionFullAlternationContainer = style({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  '@media': {
    [MediaQuery.Mobile]: {
      flexDirection: 'column',
      overflow: 'hidden',
      alignItems: 'flex-start',
    },
  },
});

const sectionFullAlternationContainerEven = style([
  sectionFullAlternationContainer,
  {
    flexDirection: 'row-reverse',
  },
]);

const sectionPartContainer = style({
  flex: 1,
  '@media': {
    [MediaQuery.Desktop]: {
      padding:
        'var(--cardStyle-gap) var(--cardStyle-gap-right) var(--cardStyle-gap) var(--cardStyle-gap-left)',
    },
    [MediaQuery.Mobile]: {
      padding:
        'var(--cardStyle-gap) var(--cardStyle-gap) 0 var(--cardStyle-gap)',
    },
  },
});

const columnWidth = style({
  flex: 1,
  '@media': {
    [MediaQuery.Desktop]: {
      width: '50%',
    },
    [MediaQuery.Mobile]: {
      width: '100%',
    },
  },
});

const sectionPartFullAlternationContainer = style({
  flex: 1,
  '@media': {
    [MediaQuery.Mobile]: {
      width: '100vw',
    },
  },
});

const imageContainer = style({
  width: '100%',
  position: 'relative',
  aspectRatio: '1',
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

const sectionTextFullAlternationContainer = style([
  sectionPartFullAlternationContainer,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    '@media': {
      [MediaQuery.Mobile]: {
        padding: '40px 20px',
      },
    },
  },
]);

const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});

const sectionFullAlternation = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  '@media': {
    [MediaQuery.Desktop]: {
      width: '300px',
    },
    [MediaQuery.Mobile]: {
      width: '100%',
    },
  },
});

const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 'min(100vw, 1000px)',
  margin: '0 auto',
  flex: 1,
});

const containerFullAlternation = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: '0 auto',
  flex: 1,
});

const media = style({
  width: '100%',
  height: '100%',
  transform: 'scale(1)',
  transition: 'transform 1s ease-in-out',

  selectors: {
    [`${imageContainer}:hover &`]: {
      transform: 'scale(1.2)',
      transition: 'transform 1s ease-in-out',
    },
  },
});

const link = style({
  justifyContent: 'center',
  alignItems: 'center',
  padding: '15px 20px',
  textDecoration: 'none',
  display: 'flex',
});

const mediaGaps = {
  padding: 'var(--cardStyle-gap) 0 var(--cardStyle-gap) var(--cardStyle-gap)',
};

const mediaGapsEven = {
  padding: 'var(--cardStyle-gap) var(--cardStyle-gap) var(--cardStyle-gap) 0',
};

export default {
  mediaGaps,
  mediaGapsEven,
  container,
  sectionContainer,
  imageContainer,
  section,
  sectionFullAlternation,
  sectionContainerEven,
  sectionFullAlternationContainerEven,
  sectionFullAlternationContainer,
  containerFullAlternation,
  sectionPartContainer,
  sectionTextContainer,
  sectionPartFullAlternationContainer,
  sectionTextFullAlternationContainer,
  media,
  link,
  columnWidth,
};
