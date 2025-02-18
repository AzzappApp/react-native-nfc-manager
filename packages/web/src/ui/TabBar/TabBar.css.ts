import { style } from '@vanilla-extract/css';
import { vars } from '#app/[userName]/theme.css';

const tabBar = style({
  display: 'flex',
  flexDirection: 'row',
});

const tab = style({
  appearance: 'none',
  background: vars.color.transparent,
  borderWidth: 0,
  padding: 0,

  flex: 1,
  height: 72,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  rowGap: 10,

  borderBottomWidth: 4,
  borderColor: vars.color.transparent,

  color: vars.color.grey300,

  transition: 'border-color 0.2s, color 0.2s',
  selectors: {
    '&:active': {
      color: vars.color.pureBlack,
      borderColor: vars.color.pureBlack,
    },
    '&[aria-selected="true"]': {
      color: vars.color.pureBlack,
      borderColor: vars.color.pureBlack,
    },
    '*:has(button:active) > &:not(:active)': {
      color: vars.color.grey300,
      borderColor: vars.color.transparent,
    },
  },
});

const styles = {
  tabBar,
  tab,
};

export default styles;
