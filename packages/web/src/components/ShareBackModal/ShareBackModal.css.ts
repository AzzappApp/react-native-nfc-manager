import { style } from '@vanilla-extract/css';
import { textXLarge, textLarge, vars } from '#app/[userName]/theme.css';

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

const title = style([{ marginLeft: '0 10px' }, textLarge]);

const avatarContainer = style({
  position: 'absolute',
  top: `-${AVATAR_CONTAINER_TOP_POSITION}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '30px',
});

const avatarWrapper = style({
  borderRadius: '50%',
  width: '70px',
  height: '70px',
  overflow: 'hidden',
  backgroundColor: 'white',
  border: '2px solid white',
  boxShadow: `
    0 0 0 3px black, 
    0 0 0 5px white  
  `,
  textAlign: 'center',
  verticalAlign: 'middle',
});

const avatarImage = style({
  objectFit: 'cover',
  width: '100%',
  height: '100%',
});

const iconWrapper = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
});

const avatarInitials = style([
  {
    color: vars.color.grey100,
  },
  iconWrapper,
  textXLarge,
]);

const styles = {
  header,
  headerContainsAvatars,
  avatarContainer,
  avatarWrapper,
  iconWrapper,
  avatarImage,
  avatarInitials,
  title,
};

export default styles;
