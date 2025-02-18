import { style } from '@vanilla-extract/css';
import { MediaQuery } from '../theme.css';

const background = style({
  backgroundColor: '#FFFFFF',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  alignSelf: 'center',
  width: '100%',
});

const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  alignSelf: 'center',
  marginTop: '70px',
  '@media': {
    [MediaQuery.Desktop]: {
      flex: 1,
      width: '500px',
    },
    [MediaQuery.Mobile]: {
      height: '100%',
      width: '100%',
      paddingTop: '40px',
      paddingBottom: '40px',
      paddingLeft: '50px',
      paddingRight: '50px',
    },
  },
});

const styles = {
  background,
  container,
};

export default styles;
