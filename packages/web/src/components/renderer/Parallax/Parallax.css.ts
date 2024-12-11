import { style } from '@vanilla-extract/css';

const moduleContainer = style({ position: 'relative', overflow: 'hidden' });

const parallaxContainer = style({
  height: '100vh',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
});

const parallaxItem = style({
  height: '100vh',
  width: '100%',
  overflow: 'hidden',
  position: 'absolute',
  willChange: 'transform',
});

export default { parallaxContainer, parallaxItem, moduleContainer };
