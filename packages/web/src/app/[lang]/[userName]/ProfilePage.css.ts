import { style } from '@vanilla-extract/css';
import { MediaQuery } from '#app/theme.css';

const wrapper = style({
  display: 'flex',
  flexDirection: 'row',
});

const modules = style({
  height: '100vh',
  transitionTimingFunction: 'ease-out',
  '@media': {
    [MediaQuery.Desktop]: {
      transition: 'margin-right 0.3s',
      overflowX: 'hidden',
      flex: 1,
    },
    [MediaQuery.Mobile]: {
      transformStyle: 'preserve-3d',
      zIndex: 2,
      width: '100%',
      transition: 'transform 1s ease',
      position: 'absolute',
      overflowY: 'scroll',
      transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg)',
      backfaceVisibility: 'hidden',
      // Fix backface-visibility on Chrome and Edge
      opacity: 0.999,
    },
  },
});

const posts = style({
  transitionTimingFunction: 'ease-out',
  height: '100vh',
  '@media': {
    [MediaQuery.Desktop]: {
      transition: 'width 0.3s',
      width: '300px',
      position: 'fixed',
      right: 0,
    },
    [MediaQuery.Mobile]: {
      transition: 'transform 1s ease',
      position: 'absolute',
      transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg)',
      backfaceVisibility: 'hidden',
      width: '100%',
      // Fix backface-visibility on Chrome and Edge
      opacity: 0.999,
    },
  },
  zIndex: 2,
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
      transform: 'perspective(1000px) rotateY(179.9deg)',
    },
  },
});

const postsBehind = style({
  '@media': {
    [MediaQuery.Mobile]: {
      transform: 'perspective(1000px) rotateY(-179.9deg)',
      zIndex: 1,
    },
  },
});

const switchContent = style({
  position: 'fixed',
  padding: '13px',
  backgroundColor: 'rgba(14, 18, 22, 0.40);',
  bottom: '15px',
  right: '15px',
  borderRadius: '200px',
  zIndex: 999,
  '@media': {
    [MediaQuery.Desktop]: {
      display: 'none',
    },
  },
});

const postNavigation = style({
  transition: 'visibility 0s 0.3s',
  position: 'fixed',
  zIndex: 1,
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

const styles = {
  wrapper,
  modules,
  posts,
  modulesWithPosts,
  modulesBehind,
  postsBehind,
  switchContent,
  postNavigation,
  postNavigationHidden,
  postsClosed,
};

export default styles;
