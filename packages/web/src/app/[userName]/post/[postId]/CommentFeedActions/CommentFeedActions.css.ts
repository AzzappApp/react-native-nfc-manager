import { style } from '@vanilla-extract/css';
import {
  MediaQuery,
  textSmall,
  textSmallBold,
  vars,
} from '#app/[userName]/theme.css';

const wrapper = style({
  width: '100%',
  borderTopColor: vars.color.grey100,
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  '@media': {
    [MediaQuery.Desktop]: {
      height: 145,
      position: 'absolute',
      bottom: 0,
      padding: '20px 10px 10px 10px',
    },
    [MediaQuery.Mobile]: {
      borderBottomColor: vars.color.grey100,
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      padding: '10px 10px 10px 10px',
    },
  },
});

const actions = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const buttons = style({
  display: 'flex',
  flexDirection: 'row',
  gap: '10px',
  color: vars.color.grey400,
});

const likes = style([textSmallBold, { color: vars.color.black }]);

const elapsed = style([
  textSmall,
  {
    color: vars.color.grey400,
    '@media': {
      [MediaQuery.Mobile]: {
        display: 'none',
      },
    },
  },
]);

const comment = style({
  '@media': {
    [MediaQuery.Desktop]: {
      marginTop: '10px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    [MediaQuery.Mobile]: {
      display: 'none',
    },
  },
});

const styles = {
  wrapper,
  actions,
  buttons,
  likes,
  elapsed,
  comment,
};

export default styles;
