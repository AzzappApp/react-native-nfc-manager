import { style } from '@vanilla-extract/css';
import { textXLarge, vars } from '#app/theme.css';

const contentWrapper = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
});

const avatarInitials = style([
  {
    color: vars.color.grey100,
    textTransform: 'uppercase',
  },
  contentWrapper,
  textXLarge,
]);

const avatarImage = style({
  objectFit: 'cover',
  width: '100%',
  height: '100%',
});

const avatarWrapper = style({
  borderRadius: '50%',
  width: '70px',
  height: '70px',
  overflow: 'hidden',
  backgroundColor: 'white',
  border: '2px solid white',
  boxShadow: `
    0 0 0 2px black, 
    0 0 0 4px white  
  `,
  textAlign: 'center',
  verticalAlign: 'middle',
});

const avatarMedium = style({
  width: '70px',
  height: '70px',
});

const styles = {
  contentWrapper,
  avatarWrapper,
  avatarImage,
  avatarInitials,
  avatarMedium,
};

export default styles;
