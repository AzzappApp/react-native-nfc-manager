import { style } from '@vanilla-extract/css';
import { MediaQuery, vars } from '#app/theme.css';

const feed = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  borderLeftColor: vars.color.grey100,
  borderLeftWidth: '1px',
  borderLeftStyle: 'solid',
  '@media': {
    [MediaQuery.Desktop]: {
      paddingBottom: '130px',
      position: 'relative',
    },
  },
});

const styles = {
  feed,
};

export default styles;
