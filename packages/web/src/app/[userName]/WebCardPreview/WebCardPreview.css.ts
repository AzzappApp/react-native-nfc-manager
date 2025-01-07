import { style } from '@vanilla-extract/css';

const webCardPreviewContainer = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
});

const coverContainer = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,
  width: '100%',
});

const cover = style({
  boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.20)',
  overflow: 'hidden',
  borderRadius: 30,
});

const styles = {
  webCardPreviewContainer,
  coverContainer,
  cover,
};

export default styles;
