import { style } from '@vanilla-extract/css';

const carousel = style({
  display: 'flex',
  width: '100vw',
  overflow: 'hidden',
});

const itemContainer = style({
  transition: 'all 0.5s cubic-bezier(0.5, 1, 0.89, 1)',
});

const styles = {
  itemContainer,
  carousel,
};

export default styles;
