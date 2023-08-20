import { style } from '@vanilla-extract/css';

const coverMedia = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

const backgroundMedia = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  filter: 'blur(2px)',
});

const content = style({
  position: 'relative',
  margin: 'auto',
  maxWidth: '375px',
});

const foregroundMedia = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  maskSize: 'cover',
  maskRepeat: 'no-repeat',
  maskPosition: 'center',
});

const styles = {
  coverMedia,
  backgroundMedia,
  content,
  foregroundMedia,
};

export default styles;
