import { style } from '@vanilla-extract/css';

const moduleContainer = style({ position: 'relative', overflow: 'hidden' });

const parallaxContainer = style({
  width: '100vw',
  height: '100dvh',
  position: 'relative',
});

const parallaxLayer = style({
  height: '100%',
  width: '100%',
  position: 'absolute',
  display: 'flex',
  justifyContent: 'center',
  clipPath: 'inset(0 0 0 0)',
});

const parallaxItem = style({
  height: '100%',
  width: '100%',
  position: 'fixed',
  willChange: 'transform',
  top: 0,
  left: 0,
  transform: 'translateZ(0)',
});

export default {
  parallaxLayer,
  parallaxContainer,
  parallaxItem,
  moduleContainer,
};
