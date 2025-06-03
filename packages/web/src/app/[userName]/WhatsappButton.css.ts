import { style } from '@vanilla-extract/css';
import { MediaQuery, textButtonMedium, vars } from '../theme.css';

const whatsappAvatar = style({
  width: 50,
  height: 50,
  borderRadius: 200,
  boxShadow: 'none',
});

const whatsappContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 200,
  zIndex: 3,
  width: 50,
  height: 50,
  cursor: 'pointer',
  backgroundColor: 'rgba(14, 18, 22, 0.40)',
  position: 'relative',
});

const whatsappIcon = style({
  position: 'absolute',
  bottom: -7,
  right: 0,
  width: 28,
  height: 28,
});

const modal = style({
  zIndex: 4,
  padding: 20,
  '@media': {
    [MediaQuery.Mobile]: {
      position: 'fixed',
      bottom: 0,
      width: '100%',
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
  },
});

const modalTitle = style([
  textButtonMedium,
  {
    textAlign: 'center',
    color: vars.color.grey400,
    marginBottom: 20,
  },
]);

const modalRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 0px',
  cursor: 'pointer',
});

const numberCell = style({
  display: 'flex',
  gap: 20,
  alignItems: 'center',
});

const styles = {
  whatsappContainer,
  whatsappIcon,
  whatsappAvatar,
  modal,
  modalTitle,
  modalRow,
  numberCell,
};

export default styles;
