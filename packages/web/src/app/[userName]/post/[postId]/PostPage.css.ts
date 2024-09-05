import { style } from '@vanilla-extract/css';
import { MediaQuery, vars } from '#app/[userName]/theme.css';

const background = style({
  width: '100%',
  paddingBottom: '20px',
  '@media': {
    [MediaQuery.Desktop]: {
      background: `linear-gradient(180deg, ${vars.color.grey50} 9.96%, ${vars.color.white} 33.25%)`,
    },
  },
});

const postFeedHeader = style({
  '@media': {
    [MediaQuery.Desktop]: {
      display: 'none',
    },
  },
});

const center = style({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
});

const wrapper = style({
  backgroundColor: vars.color.white,
  width: '100%',
  display: 'flex',
  '@media': {
    [MediaQuery.Desktop]: {
      flexDirection: 'row',
      boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.20)',
      borderRadius: '10px',
      overflow: 'hidden',
      maxWidth: '850px',
      margin: '50px 50px 40px 50px',
    },
    [MediaQuery.Mobile]: {
      flexDirection: 'column',
    },
  },
});

const postSection = style({
  '@media': {
    [MediaQuery.Desktop]: {
      flex: 1,
      height: '550px',
    },
    [MediaQuery.Mobile]: {
      height: '100%',
      width: '100%',
    },
  },
});

const postMedia = style({
  position: 'relative',
  width: '100%',
  '@media': {
    [MediaQuery.Desktop]: {
      maxHeight: '550px',
      height: '100%',
    },
    [MediaQuery.Mobile]: {
      aspectRatio: '1',
    },
  },
});

const styles = {
  background,
  postFeedHeader,
  center,
  wrapper,
  postSection,
  postMedia,
};

export default styles;
