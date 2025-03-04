import { style } from '@vanilla-extract/css';
import { MediaQuery } from '../theme.css';

const button = style({
  width: 250,
  marginBottom: 50,
  '@media': {
    [MediaQuery.Mobile]: {
      marginBottom: 30,
    },
  },
});

const styles = {
  button,
};

export default styles;
