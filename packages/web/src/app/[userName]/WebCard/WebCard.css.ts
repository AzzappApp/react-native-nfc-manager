import { style } from '@vanilla-extract/css';
import { MediaQuery, textLarge, vars } from '#app/[userName]/theme.css';

const wrapper = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
});

const modules = style({
  transitionTimingFunction: 'ease-out',
  '@media': {
    [MediaQuery.Desktop]: {
      transition: 'margin-right 0.3s',
      overflowX: 'hidden',
      flex: 1,
      width: '100%',
    },
    [MediaQuery.Mobile]: {
      zIndex: 2,
      width: '100%',
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
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  borderRadius: 30,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  '@media': {
    [MediaQuery.Desktop]: {
      backdropFilter: 'blur(15px)',
      boxShadow: 'none',
      paddingTop: 20,
    },
  },
});

const title = style([
  textLarge,
  {
    color: vars.color.black,
  },
]);

const header = style({
  position: 'fixed',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 10,
  gap: 10,
  top: 0,
  width: '100%',
});

const styles = {
  wrapper,
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
  header,
  title,
};

export default styles;
