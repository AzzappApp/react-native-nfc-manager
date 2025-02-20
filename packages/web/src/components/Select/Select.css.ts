import { style } from '@vanilla-extract/css';
import { vars } from '#app/[userName]/theme.css';

export const section = style({
  display: 'flex',
  padding: 15,
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 10,
  alignSelf: 'stretch',
  borderRadius: 12,
  backgroundColor: 'white',
  border: `1px solid ${vars.color.grey50}`,
  width: '100%',
});

export const container = style({
  display: 'flex',
  alignItems: 'center',
  borderRadius: 8,
  justifyContent: 'space-between',
});

export const selectContainer = style({
  display: 'flex',
  alignItems: 'center',
  paddingLeft: 8,
  borderRadius: 8,
  justifyContent: 'space-between',
  ':hover': {
    outlineColor: vars.color.grey900,
    backgroundColor: vars.color.grey50,
    cursor: 'pointer',
  },
  width: '100%',
});

export const openedContainer = style([
  section,
  {
    position: 'absolute',
    padding: 0,
    boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.20)',
    zIndex: 3,
    maxHeight: 200,
  },
]);

export const itemContainer = style({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0px',
  position: 'relative',
  gap: 10,
  alignItems: 'center',
  borderRadius: 8,
  alignSelf: 'stretch',
  ':hover': {
    outlineColor: vars.color.grey900,
    backgroundColor: vars.color.grey50,
    cursor: 'pointer',
  },
  selectors: {
    [`${openedContainer} &`]: {
      padding: 8,
    },
  },
});

export const itemLabel = style({
  flex: 1,
});

export const imgContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  borderRadius: 5,
});

export const arrow = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 26,
  width: 26,
  height: 26,
  marginRight: 10,
  ':hover': {
    backgroundColor: vars.color.grey100,
    cursor: 'pointer',
  },
});

export const listItemContainer = style({
  width: '100%',
  overflow: 'auto',
  '::-webkit-scrollbar': {
    display: 'none',
  },
});

export const bottomItem = style({
  width: '100%',
});

export const buttonActive = style({
  outlineColor: vars.color.grey900,
  backgroundColor: vars.color.grey50,
});
