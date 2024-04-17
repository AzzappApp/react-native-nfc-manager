import { style } from '@vanilla-extract/css';
import { textLargeSemiBold, vars } from '#app/[userName]/theme.css';

const AVATAR_CONTAINER_TOP_POSITION = 35;

const headerContainsAvatars = style({});
const header = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingBottom: '20px',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: vars.color.grey100,
  marginTop: `${AVATAR_CONTAINER_TOP_POSITION}px`,

  selectors: {
    [`:not(${headerContainsAvatars})&`]: {
      marginTop: 0,
    },
  },
});

const title = style([{ marginLeft: '0 10px' }, textLargeSemiBold]);

const avatarContainer = style({
  position: 'absolute',
  top: `-${AVATAR_CONTAINER_TOP_POSITION}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '20px',
});

const styles = {
  header,
  headerContainsAvatars,
  avatarContainer,
  title,
};

export default styles;
