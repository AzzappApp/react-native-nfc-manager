import { style } from '@vanilla-extract/css';
import { textLargeSemiBold, vars } from '#app/[userName]/theme.css';

const AVATAR_CONTAINER_TOP_POSITION = 35;

const header = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingBottom: '20px',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: vars.color.grey100,
  marginTop: `${AVATAR_CONTAINER_TOP_POSITION}px`,
});

const title = style([{ marginLeft: '0 10px' }, textLargeSemiBold]);

const avatarContainer = style({
  position: 'absolute',
  top: -AVATAR_CONTAINER_TOP_POSITION,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '20px',
  zIndex: 1,
});

const shareBackModal = style({
  marginTop: AVATAR_CONTAINER_TOP_POSITION,
  maxHeight: `calc(100% - ${AVATAR_CONTAINER_TOP_POSITION}px)`,
});

const styles = {
  header,
  avatarContainer,
  title,
  shareBackModal,
};

export default styles;
