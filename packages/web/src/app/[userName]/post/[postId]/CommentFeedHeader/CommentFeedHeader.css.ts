import { style } from '@vanilla-extract/css';
import { MediaQuery, vars } from '#app/theme.css';

const feedHeader = style({
  padding: '20px 10px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottomColor: vars.color.grey100,
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  width: '100%',
  height: '75px',
  '@media': {
    [MediaQuery.Mobile]: {
      display: 'none',
    },
  },
});

const feedHeaderProfile = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  textDecoration: 'none',
  color: vars.color.black,
});

const feedHeaderProfileCover = style({
  marginRight: 5,
  borderRadius: 3,
  overflow: 'hidden',
  height: '32px',
  position: 'relative',
});

const userName = style({
  maxWidth: 160,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const styles = {
  feedHeader,
  feedHeaderProfile,
  feedHeaderProfileCover,
  userName,
};

export default styles;
