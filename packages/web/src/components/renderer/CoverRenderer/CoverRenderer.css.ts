import { style } from '@vanilla-extract/css';
import { MediaQuery } from '#app/[userName]/theme.css';

const coverMedia = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
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
      maxWidth: '500px',
      borderRadius: 35,
      boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.20)',
    },
  },
});

const backgroundContent = style({
  position: 'absolute',
  overflow: 'hidden',
  width: '100%',
  height: '100%',
  '@media': {
    [MediaQuery.Desktop]: {
      borderRadius: 39, //hack to avoid having a line with the background color  on the border
    },
  },
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
      height: '870px',
    },
  },
});

const linkShadow = style({
  boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.20)',
});

const overlayTitle = style({
  color: 'white',
  fontSize: 21,
  position: 'absolute',
  maxWidth: '70%',
  left: '22%',
  top: '45.5%',
  textOverflow: 'ellipsis',
  height: 30,
  maxLines: 1,
  overflow: 'hidden',
});

const overlaySubTitle = style({
  color: 'white',
  fontSize: 29,
  position: 'absolute',
  width: '70%',
  left: '22%',
  top: '49%',
  maxLines: 1,
  textOverflow: 'ellipsis',
  maxHeight: 40,
  overflow: 'hidden',
});

const styles = {
  coverMedia,
  content,
  backgroundContent,
  backgroundMedia,
  linkShadow,
  overlayTitle,
  overlaySubTitle,
};

export default styles;
