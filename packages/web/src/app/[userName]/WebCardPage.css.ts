import { style } from '@vanilla-extract/css';
import { MediaQuery } from '#app/[userName]/theme.css';

const wrapper = style({
  display: 'flex',
  flexDirection: 'row',
});

const background = style({
  position: 'fixed',
  top: '-10vh',
  left: 0,
  width: '100%',
  height: '120vh',
});

const modules = style({
  transitionTimingFunction: 'ease-out',
  '@media': {
    [MediaQuery.Desktop]: {
      transition: 'margin-right 0.3s',
      overflowX: 'hidden',
      flex: 1,
    },
    [MediaQuery.Mobile]: {
      zIndex: 2,
      width: '100%',
      /*
      transformStyle: 'preserve-3d',
      transition: 'transform 1s ease',
      position: 'absolute',
      transform: 'rotateY(0deg) rotateX(0deg)',
      backfaceVisibility: 'hidden',
      // Fix backface-visibility on Chrome and Edge
      opacity: 0.999,
      */
    },
  },
});

const posts = style({
  transitionTimingFunction: 'ease-out',
  '@media': {
    [MediaQuery.Desktop]: {
      display: 'flex',
      flexDirection: 'row',
      transition: 'width 0.3s',
      width: '400px',
      position: 'fixed',
      right: 0,
    },
    [MediaQuery.Mobile]: {
      width: '100%',

      /*
      transition: 'transform 1s ease',
      position: 'absolute',
      transform: 'rotateY(0deg) rotateX(0deg)',
      backfaceVisibility: 'hidden',
      // Fix backface-visibility on Chrome and Edge
      opacity: 0.999,
      */
    },
  },
  zIndex: 2,
});

const postsContent = style({
  '@media': {
    [MediaQuery.Desktop]: {
      width: '350px',
    },
    [MediaQuery.Mobile]: {
      background: '#FFF!important',
    },
  },
});

const postsClosed = style({
  '@media': {
    [MediaQuery.Desktop]: {
      width: 0,
    },
  },
});

const modulesWithPosts = style({
  '@media': {
    [MediaQuery.Desktop]: {
      marginRight: '300px',
    },
  },
});

const modulesBehind = style({
  '@media': {
    [MediaQuery.Mobile]: {
      // transform: 'rotateY(179.9deg)',
      display: 'none',
    },
  },
});

const postsBehind = style({
  '@media': {
    [MediaQuery.Mobile]: {
      // transform: 'rotateY(-179.9deg)',
      zIndex: 1,
      display: 'none',
    },
  },
});

const switchContent = style({
  position: 'fixed',
  padding: '13px',
  backgroundColor: 'rgba(14, 18, 22, 0.40)',
  bottom: '15px',
  right: '15px',
  borderRadius: '200px',
  zIndex: 3,
  '@media': {
    [MediaQuery.Desktop]: {
      display: 'none',
    },
  },
});

const postNavigation = style({
  transition: 'visibility 0s 0.3s',
  position: 'fixed',
  zIndex: 2,
  top: '20px',
  right: '20px',
  '@media': {
    [MediaQuery.Mobile]: {
      visibility: 'hidden',
    },
  },
});

const postNavigationHidden = style({
  visibility: 'hidden',
});

const coverContainer = style({
  '@media': {
    [MediaQuery.Desktop]: {
      padding: '50px 0 20px 0',
      backdropFilter: 'blur(15px)',
    },
  },
});

const styles = {
  wrapper,
  background,
  modules,
  posts,
  postsContent,
  modulesWithPosts,
  modulesBehind,
  postsBehind,
  switchContent,
  postNavigation,
  postNavigationHidden,
  postsClosed,
  coverContainer,
};

export default styles;
