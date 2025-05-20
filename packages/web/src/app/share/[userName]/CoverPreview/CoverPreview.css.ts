import { style } from '@vanilla-extract/css';
import { MediaQuery } from '../../../[userName]/theme.css';

const coverPreviewContainer = style({
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
  position: 'relative',
  boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.20)',
  overflow: 'hidden',
  borderRadius: 35,
});

const coverContentClass = style({
  '@media': {
    [MediaQuery.Mobile]: {
      fontSize: '0.4vw',
    },
    [MediaQuery.Desktop]: {
      fontSize: 3,
    },
  },
});

const styles = {
  coverPreviewContainer,
  coverContainer,
  cover,
  coverContentClass,
};

export default styles;
