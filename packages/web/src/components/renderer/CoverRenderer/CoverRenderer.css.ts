import { style } from '@vanilla-extract/css';
import { MediaQuery } from '#app/theme.css';

const wrapper = style({
  filter: 'blur(15px)',
  position: 'absolute',
  top: '-4%',
  left: '-4%',
  width: '110%',
  height: '110%',
  willChange: 'blur',
});

const coverMedia = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

const backgroundMedia = style({
  objectFit: 'cover',
  objectPosition: 'bottom',
  '@media': {
    [MediaQuery.Mobile]: {
      display: 'none',
    },
    [MediaQuery.Desktop]: {
      display: 'block',
    },
  },
});

const content = style({
  position: 'relative',
  margin: 'auto',

  '@media': {
    [MediaQuery.Mobile]: {
      width: '100vw',
    },
    [MediaQuery.Desktop]: {
      maxWidth: '375px',
    },
  },
});

const layerMedia = style({
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
  wrapper,
  coverMedia,
  backgroundMedia,
  content,
  layerMedia,
};

export default styles;
