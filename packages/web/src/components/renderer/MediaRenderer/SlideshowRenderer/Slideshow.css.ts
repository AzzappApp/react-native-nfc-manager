import { style } from '@vanilla-extract/css';

const container = style({
  display: 'flex',
  width: '100%',
  justifyContent: 'center',
});

const slideshow = style({
  width: '100%',
  maxWidth: '900px',
  display: 'flex',
  flexDirection: 'row',
  aspectRatio: '3',
  position: 'relative',
  zIndex: 1,
});

const arrow = style({
  position: 'absolute',
  top: 'calc(50% - 10px)',
  zIndex: 2,
  width: 20,
  height: 20,
  borderRadius: 20,
  overflow: 'hidden',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const arrowIcon = style({ color: 'white', width: 15, height: 15 });

const media = style({
  height: '100%',
  position: 'absolute',
  transition: 'all 0.5s cubic-bezier(0.5, 1, 0.89, 1)',
  borderRadius: '25px',
  overflow: 'hidden',
});

const styles = {
  container,
  slideshow,
  arrow,
  arrowIcon,
  media,
};

export default styles;
