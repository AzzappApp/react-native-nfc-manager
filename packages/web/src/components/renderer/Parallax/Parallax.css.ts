import { style } from '@vanilla-extract/css';

const moduleContainer = style({ position: 'relative', overflow: 'hidden' });

const parallaxContainer = style({
  height: '100vh',
  position: 'relative',
  overflow: 'hidden',
});

const parallaxItem = style({
  height: '120vh',
  width: '100%',
  overflow: 'hidden',
  position: 'absolute',
});

export default { parallaxContainer, parallaxItem, moduleContainer };
