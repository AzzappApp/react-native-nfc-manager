import { style } from '@vanilla-extract/css';
import {
  MediaQuery,
  textLarge,
  textLargeSemiBold,
  vars,
} from '#app/[userName]/theme.css';

const modal = style({
  paddingBottom: 0,
});

const header = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBottom: '20px',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: vars.color.grey100,
});

const title = style([textLarge]);

const likes = style({
  display: 'flex',
  flexDirection: 'column',
  marginTop: '10px',
  gap: '15px',
  paddingLeft: '10px',
  paddingRight: '10px',
  paddingBottom: '10px',
  maxHeight: '300px',
  '@media': {
    [MediaQuery.Desktop]: {
      overflowY: 'scroll',
    },
    [MediaQuery.Mobile]: {
      overflowY: 'hidden',
    },
  },
});

const like = style({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

const cover = style({
  marginRight: 5,
  borderRadius: 3,
  overflow: 'hidden',
  width: '35px',
  height: '56px',
  position: 'relative',
});

const username = style([
  textLargeSemiBold,
  {
    textDecoration: 'none',
    color: 'black',
    marginLeft: '5px',
  },
]);

export const styles = {
  modal,
  header,
  title,
  likes,
  like,
  cover,
  username,
};
