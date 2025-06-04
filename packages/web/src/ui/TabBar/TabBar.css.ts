import { style } from '@vanilla-extract/css';
import { vars } from '#app/theme.css';

const baseStyles = {
  tabBar: style({
    display: 'flex',
    flexDirection: 'row',
  }),
  tab: style({
    appearance: 'none',
    background: vars.color.transparent,
    borderWidth: 0,
    padding: 0,

    flex: 1,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: 10,
    transition: 'all 0.2s ease-in-out',
  }),
};

const defaultStyles = {
  tabBar: baseStyles.tabBar,
  tab: style([
    baseStyles.tab,
    {
      height: 72,
      justifyContent: 'flex-start',
      borderBottomWidth: 4,
      borderColor: vars.color.transparent,
      color: vars.color.grey300,
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
    },
  ]),
};

const toggleStyles = {
  tabBar: style([baseStyles.tabBar, { gap: 10 }]),
  tab: style([
    baseStyles.tab,
    {
      justifyContent: 'center',
      border: '1px solid transparent',
      borderRadius: 12,
      height: 66,
      color: vars.color.pureBlack,
      backgroundColor: vars.color.grey50,
      selectors: {
        '&:active:not(:disabled)': {
          backgroundColor: vars.color.transparent,
          borderColor: vars.color.pureBlack,
        },
        '&:not(:disabled)[aria-selected="true"]': {
          backgroundColor: vars.color.transparent,
          borderColor: vars.color.pureBlack,
        },
        '*:has(button:active) > &:not(:active):not(:disabled)': {
          backgroundColor: vars.color.grey50,
          borderColor: vars.color.transparent,
        },
        '&:disabled': {
          backgroundColor: vars.color.grey50,
          borderColor: vars.color.transparent,
          color: vars.color.grey200,
          cursor: 'not-allowed',
          backgroundImage: `
            linear-gradient(to top left,
             rgba(0,0,0,0) 0%,
             rgba(0,0,0,0) calc(50% - 0.8px),
             ${vars.color.grey200} 50%,
             rgba(0,0,0,0) calc(50% + 0.8px),
             rgba(0,0,0,0) 100%)
          `,
        },
      },
    },
  ]),
};

const stylesVariants = {
  default: defaultStyles,
  toggle: toggleStyles,
};

export default stylesVariants;
