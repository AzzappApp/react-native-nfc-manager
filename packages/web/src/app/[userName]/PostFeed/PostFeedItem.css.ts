import { style } from '@vanilla-extract/css';
import {
  MediaQuery,
  textMedium,
  textSmall,
  textSmallBold,
  vars,
} from '#app/[userName]/theme.css';

const post = style({
  '@media': {
    [MediaQuery.Mobile]: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: vars.color.grey100,
    },
  },
});

const postHeader = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
  padding: '10px',
  background: 'none',
  border: 'none',
  '@media': {
    [MediaQuery.Desktop]: {
      display: 'none',
    },
  },
});

const postAuthorCover = style({
  marginRight: 5,
  borderRadius: 3,
  overflow: 'hidden',
  height: '32px',
  position: 'relative',
});

const postAuthorUsername = style({
  color: vars.color.black,
});

const postMedias = style({
  position: 'relative',
  width: '100%',
  '@media': {
    [MediaQuery.Desktop]: {
      paddingLeft: '20px',
      paddingRight: '20px',
    },
  },
});

const postFooter = style({
  padding: '16px 10px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  '@media': {
    [MediaQuery.Desktop]: {
      display: 'none',
    },
  },
});

const postActions = style({
  display: 'flex',
  gap: '10px',
});

const postCounterReactions = style([textSmallBold]);

const postMore = style({
  margin: '0 10px 20px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  '@media': {
    [MediaQuery.Desktop]: {
      display: 'none',
    },
  },
});

const postComment = style({
  margin: 0,
  lineClamp: 5,
  WebkitLineClamp: 5,
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

const postCommentName = style({
  fontWeight: vars.fontWeight.semiBold,
});

const postSeeMore = style([
  textMedium,
  {
    textDecoration: 'none',
    color: vars.color.grey400,
    ':visited': { textDecoration: 'none', color: vars.color.grey400 },
    ':hover': { textDecoration: 'none', color: vars.color.grey400 },
  },
]);

const postElapsedTime = style([textSmall, { color: vars.color.grey400 }]);

const styles = {
  post,
  postHeader,
  postMedias,
  postFooter,
  postActions,
  postCounterReactions,
  postMore,
  postComment,
  postCommentName,
  postSeeMore,
  postElapsedTime,
  postAuthorCover,
  postAuthorUsername,
};

export default styles;
