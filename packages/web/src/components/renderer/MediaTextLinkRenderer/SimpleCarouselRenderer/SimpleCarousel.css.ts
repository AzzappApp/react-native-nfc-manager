import { style } from '@vanilla-extract/css';

const carousel = style({
  display: 'flex',
  width: '100vw',
  overflow: 'hidden',
});

const imageContainer = style({
  overflow: 'hidden',
});

const media = style({
  transform: 'scale(1)',
  transition: 'transform 1s ease-in-out',

  selectors: {
    [`${imageContainer}:hover &`]: {
      transform: 'scale(1.2)',
      transition: 'transform 1s ease-in-out',
    },
  },
});

const itemContainer = style({
  transition: 'transform 0.5s cubic-bezier(0.5, 1, 0.89, 1)',
  width: 'min(400px, 70vw)',
});

const styles = {
  imageContainer,
  itemContainer,
  carousel,
  media,
};

export default styles;
