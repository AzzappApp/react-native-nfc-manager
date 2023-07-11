import { style } from '@vanilla-extract/css';

const background = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskSize: 'cover',
  WebkitMaskSize: 'cover',
});

const content = style({
  zIndex: '1',
});

const styles = {
  background,
  content,
};

export default styles;
