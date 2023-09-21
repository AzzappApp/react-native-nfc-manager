import { style } from '@vanilla-extract/css';
import { textMedium, textSmall, textSmallBold, vars } from '#app/theme.css';

const post = style({
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: vars.color.grey100,
});

const postHeader = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
  padding: '10px',
});

const postMedias = style({
  position: 'relative',
  width: '100%',
});

const postFooter = style({
  padding: '16px 10px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
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
};

export default styles;
