import { style } from '@vanilla-extract/css';
import { textLargeSemiBold } from '#app/[userName]/theme.css';

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
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
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
});

const closedDialog = style([
  {
    transform: 'translate(0, 100%)',
  },
]);

const message = style(
  {
    textAlign: 'center',
    maxWidth: '335px',
    marginTop: `${AVATAR_CONTAINER_TOP_POSITION}px`,
  },
  textLargeSemiBold,
);

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

const styles = {
  overlay,
  dialog,
  message,
  closeButton,
  openedOverlay,
  closedDialog,
  avatarContainer,
};

export default styles;
