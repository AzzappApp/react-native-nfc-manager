import { style } from '@vanilla-extract/css';
import { MediaQuery, textSmallBold } from '#app/[userName]/theme.css';

const postMedia = style({
  transition: 'all 0.3s ease-out',
  objectFit: 'cover',
  '@media': {
    [MediaQuery.Desktop]: {
      borderRadius: 10,
    },
  },
});

const reactions = style({
  position: 'absolute',
  transition: 'all 0.3s ease-out',
  bottom: 0,
  left: 20,
  opacity: 0,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
});

const reactionsOpen = style({
  '@media': {
    [MediaQuery.Desktop]: {
      bottom: 10,
      opacity: 1,
    },
  },
});

const expand = style({
  position: 'absolute',
  transition: 'all 0.3s ease-out',
  top: 0,
  right: 20,
  opacity: 0,
});

const expandOpen = style({
  '@media': {
    [MediaQuery.Desktop]: {
      top: 10,
      opacity: 1,
    },
  },
});

const reaction = style([textSmallBold, { color: '#FFF' }]);

const shadow = style({
  '@media': {
    [MediaQuery.Desktop]: {
      pointerEvents: 'none',
      position: 'absolute',
      width: '100%',
      height: '100%',
      boxShadow: 'inset 0px 0px 0px rgba(0, 0, 0, 0.20)',
      transition: 'all 0.3s ease-out',
      top: 0,
      left: 0,
      borderRadius: 10,
    },
  },
});

const shadowActive = style({
  '@media': {
    [MediaQuery.Desktop]: {
      boxShadow: 'inset 0px 0px 20px 10px rgba(0, 0, 0, 0.20)',
    },
  },
});

const styles = {
  postMedia,
  reactions,
  reactionsOpen,
  reaction,
  expand,
  expandOpen,
  shadow,
  shadowActive,
};

export default styles;
