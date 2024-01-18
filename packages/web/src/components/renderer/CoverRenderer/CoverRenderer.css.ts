import { style } from '@vanilla-extract/css';
import { MediaQuery } from '#app/[userName]/theme.css';

const coverMedia = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

const backgroundMedia = style({
  backgroundAttachment: 'fixed',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  '@media': {
    [MediaQuery.Mobile]: {
      display: 'none',
    },
    [MediaQuery.Desktop]: {
      display: 'block',
      height: '580px',
    },
  },
});

const content = style({
  position: 'relative',
  margin: 'auto',
  overflow: 'hidden',
  '@media': {
    [MediaQuery.Mobile]: {
      width: '100vw',
    },
    [MediaQuery.Desktop]: {
      maxWidth: '300px',
      borderRadius: 35,
      boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.20)',
    },
  },
});

const appearZoomIn = style({
  transformOrigin: 'top center',
});

const appearZoomOut = style({
  transformOrigin: 'top center',
});

const smoothZoomIn = style({
  transformOrigin: 'top center',
});

const smoothZoomOut = style({
  transformOrigin: 'top center',
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

const layerBackground = style({
  height: 580,
  position: 'fixed',
});

const styles = {
  layerBackground,
  coverMedia,
  backgroundMedia,
  content,
  layerMedia,
  appearZoomIn,
  appearZoomOut,
  smoothZoomIn,
  smoothZoomOut,
};

export default styles;
