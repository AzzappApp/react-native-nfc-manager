import { style } from '@vanilla-extract/css';
import { textButton, textLargeSemiBold, vars } from '#app/[userName]/theme.css';

const AVATAR_CONTAINER_TOP_POSITION = 35;

const overlay = style({
  position: 'absolute',
  right: 0,
  left: 0,
  bottom: 0,
  opacity: 0,
  transition: 'all 450ms cubic-bezier(0.32,1,0.23,1) 0ms',
});

const openedOverlay = style([
  {
    position: 'fixed',
    top: 0,
    opacity: 1,
    zIndex: 5,
  },
]);

const dialog = style({
  backgroundColor: 'white',
  padding: '20px',
  boxShadow: '0px -8px 8px 0px #0000001A',
  borderRadius: '22px 22px 0 0',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  rowGap: '20px',
  transform: 'translate(0,0)',
  transition: 'all 450ms cubic-bezier(0.32,1,0.23,1) 0ms',
  width: '100%',
});

const closedDialog = style([
  {
    transform: 'translate(0, 100%)',
    display: 'none',
  },
]);

const message = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  justifyContent: 'center',
  maxWidth: '335px',
  marginTop: `${AVATAR_CONTAINER_TOP_POSITION}px`,
  textAlign: 'center',
});

const closeButton = style({
  position: 'absolute',
  top: '20px',
  right: '20px',
});

const avatarContainer = style({
  position: 'absolute',
  top: `-${AVATAR_CONTAINER_TOP_POSITION}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '20px',
});

const addContact = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'fixed',
  bottom: 75,
  right: 15,
  borderRadius: 200,
  zIndex: 3,
  width: 50,
  height: 50,
  cursor: 'pointer',
  background: 'rgba(14, 18, 22, 0.40)',
});

const whatsappAvatar = style({
  width: 50,
  height: 50,
  borderRadius: 200,
  boxShadow: 'none',
});

const whatsappContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'fixed',
  bottom: 15,
  right: 15,
  borderRadius: 200,
  zIndex: 3,
  width: 50,
  height: 50,
  cursor: 'pointer',
  textDecoration: 'none',
});

const whatsappIcon = style({
  position: 'absolute',
  bottom: -7,
  right: 0,
  borderRadius: 200,
  width: 28,
  height: 28,
  cursor: 'pointer',
});

const buttonLink = style({
  backgroundColor: vars.color.grey1000,
  borderRadius: 45,
  border: `2px solid ${vars.color.black}`,
  boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.20)',
});

const userName = style([textLargeSemiBold]);
const subtitle = style([
  textButton,
  {
    color: vars.color.grey400,
  },
]);

const bottomContainer = style({
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
  alignItems: 'center',
  gap: 12,
});

const poweredByContainer = style({
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
  alignItems: 'center',
  gap: 5,
});

const poweredByLabel = style({
  fontWeight: vars.fontWeight.medium,
  fontSize: '10px',
  color: vars.color.grey400,
  lineHeight: 'normal',
});

const storeContainer = style({
  display: 'flex',
  gap: 5,
});

const styles = {
  overlay,
  dialog,
  message,
  closeButton,
  openedOverlay,
  closedDialog,
  avatarContainer,
  addContact,
  buttonLink,
  userName,
  subtitle,
  bottomContainer,
  poweredByContainer,
  poweredByLabel,
  storeContainer,
  whatsappContainer,
  whatsappIcon,
  whatsappAvatar,
};

export default styles;
