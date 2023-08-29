import { style } from '@vanilla-extract/css';

const background = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

const backgroundWrapper = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

const backgroundCover = style({
  maskSize: 'cover',
  maskRepeat: 'no-repeat',
  maskPosition: 'center',
});

const backgroundContain = style({
  maskSize: 'contain',
  maskRepeat: 'no-repeat',
  maskPosition: 'center',
});

const backgroundCenter = style({
  maskRepeat: 'no-repeat',
  maskPosition: 'center',
});

const backgroundRepeat = style({
  maskRepeat: 'repeat',
});

const backgroundStretch = style({
  maskRepeat: 'no-repeat',
  maskPosition: 'center',
  maskSize: '100% 100%',
});

const content = style({
  zIndex: '1',
});

const styles = {
  background,
  backgroundWrapper,
  backgroundCover,
  backgroundContain,
  backgroundCenter,
  backgroundRepeat,
  content,
  backgroundStretch,
};

export default styles;
