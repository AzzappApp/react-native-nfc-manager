import { style } from '@vanilla-extract/css';
import { MediaQuery } from '#app/theme.css';

const container = style({
  position: 'relative',
});

const containerFluid = style({
  height: '100%',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
});

const sound = style({
  borderRadius: 28,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  right: 20,
  justifyContent: 'center',
  '@media': {
    [MediaQuery.Desktop]: {
      transition: 'all 0.3s ease-out',
      bottom: 0,
      opacity: 0,
    },
    [MediaQuery.Mobile]: {
      bottom: 10,
      opacity: 1,
    },
  },
});

const soundOpen = style({
  bottom: '10px!important',
  opacity: '1!important',
});

const play = style({
  borderRadius: 72,
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  position: 'absolute',
  top: 'calc(50% - 36px)',
  right: 'calc(50% - 36px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const styles = {
  container,
  containerFluid,
  sound,
  soundOpen,
  play,
};

export default styles;
