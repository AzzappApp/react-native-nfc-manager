import { style } from '@vanilla-extract/css';

const sound = style({
  borderRadius: 28,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  position: 'absolute',
  right: 20,
  bottom: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  sound,
  play,
};

export default styles;
