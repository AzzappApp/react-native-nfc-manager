import { style } from '@vanilla-extract/css';
import { MediaQuery, textLarge, vars } from '#app/theme.css';
import { MAX_COVER_WIDTH } from '#components/renderer/CoverRenderer/CoverRenderer.css';

const wrapper = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
});

const modules = style({
  transitionTimingFunction: 'ease-out',
  minHeight: '100vh',
  width: '100%',
  '@media': {
    [MediaQuery.Desktop]: {
      transition: 'margin-right 0.3s',
      overflowX: 'hidden',
      flex: 1,
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

const floatingButtonsContainer = style({
  position: 'fixed',
  bottom: 15,
  right: 15,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

const switchContent = style({
  padding: '13px',
  backgroundColor: 'rgba(14, 18, 22, 0.40)',
  borderRadius: '200px',
  width: 50,
  height: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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

const coverWrapper = style({
  position: 'relative',
  flex: 1,
  boxShadow: '0px -15px 20px -6px rgba(0, 0, 0, 0.25)',
  borderBottomRightRadius: 0,
  borderBottomLeftRadius: 0,
  overflow: 'hidden',
  '@media': {
    [MediaQuery.Desktop]: {
      borderRadius: 35,
      maxWidth: MAX_COVER_WIDTH,
    },
  },
});

const footer = style({
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
  alignItems: 'center',
  gap: 20,
  padding: '30px 10px 80px 10px',
});

const poweredByContainer = style({
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
  alignItems: 'center',
  gap: 10,
});

const poweredByContainerAzzappPlus = style([
  poweredByContainer,
  {
    flexDirection: 'row',
    gap: 5,
  },
]);

const poweredByLabel = style({
  fontWeight: vars.fontWeight.regular,
  fontSize: '12px',
  lineHeight: 'normal',
});

const storeContainer = style({
  display: 'flex',
  gap: 5,
});

const azzapLink = style({
  textDecoration: 'none',
  fontSize: '12px',
  lineHeight: 'normal',
  letterSpacing: 1.2,
  textDecorationLine: 'underline',
  textDecorationStyle: 'solid',
  textDecorationSkipInk: 'none',
  textDecorationThickness: 'auto',
  textUnderlineOffset: 'auto',
  textUnderlinePosition: 'from-font',
});

const addContact = style({
  cursor: 'pointer',
  padding: '13px',
  width: 50,
  height: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(14, 18, 22, 0.40)',
  borderRadius: '200px',
});

const whatsappContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 50,
  height: 50,
  backgroundColor: 'rgba(14, 18, 22, 0.40)',
  borderRadius: '200px',
});

const whatsappAvatar = style({
  width: 40,
  height: 40,
  borderRadius: '50%',
});

const whatsappIcon = style({
  position: 'absolute',
  bottom: 0,
  right: 0,
});

const phoneMenu = style({
  minWidth: 200,
  maxWidth: 300,
  position: 'fixed',
  bottom: 75,
  right: 15,
  backgroundColor: 'white',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  padding: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  zIndex: 1000,
});

const phoneMenuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 8,
  textDecoration: 'none',
  color: 'inherit',
  borderRadius: 4,
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
  },
});

const whatsappButton = style({
  position: 'relative',
  width: 40,
  height: 40,
  cursor: 'pointer',
});

const styles = {
  wrapper,
  modules,
  posts,
  postsContent,
  modulesWithPosts,
  modulesBehind,
  postsBehind,
  floatingButtonsContainer,
  switchContent,
  postNavigation,
  postNavigationHidden,
  postsClosed,
  coverContainer,
  coverWrapper,
  header,
  title,
  footer,
  poweredByContainer,
  poweredByContainerAzzappPlus,
  poweredByLabel,
  storeContainer,
  azzapLink,
  addContact,
  whatsappContainer,
  whatsappIcon,
  whatsappAvatar,
  phoneMenu,
  phoneMenuItem,
  whatsappButton,
};

export default styles;
