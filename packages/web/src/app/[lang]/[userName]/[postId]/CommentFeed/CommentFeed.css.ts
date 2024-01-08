import { style } from '@vanilla-extract/css';
import { MediaQuery, vars } from '#app/theme.css';

const feed = style({
  display: 'flex',
  flexDirection: 'column',
  borderLeftColor: vars.color.grey100,
  borderLeftWidth: '1px',
  borderLeftStyle: 'solid',
  '@media': {
    [MediaQuery.Desktop]: {
      width: '300px',
      paddingBottom: '130px',
      position: 'relative',
    },
    [MediaQuery.Mobile]: {
      flex: 1,
    },
  },
});

const commentsContainer = style({
  flexGrow: 1,
  position: 'relative',
});

const styles = {
  feed,
  commentsContainer,
};

export default styles;
