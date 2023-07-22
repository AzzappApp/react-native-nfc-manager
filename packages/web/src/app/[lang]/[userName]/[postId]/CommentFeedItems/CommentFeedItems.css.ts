import { style } from '@vanilla-extract/css';
import {
  MediaQuery,
  textButton,
  textXSmall,
  textXXSmall,
  vars,
} from '#app/theme.css';

const feed = style({
  '@media': {
    [MediaQuery.Desktop]: {
      overflowY: 'scroll',
      height: '100%',
    },
    [MediaQuery.Mobile]: {
      overflowY: 'hidden',
    },
  },
});

const item = style({
  padding: '10px',
  display: 'flex',
  flexDirection: 'row',
  gap: '10px',
  borderBottomColor: vars.color.grey100,
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  get selectors() {
    return {
      [`${feed} &:last-child`]: {
        '@media': {
          [MediaQuery.Desktop]: {
            borderBottom: 'none',
          },
        },
      },
    };
  },
});

const comment = style({
  margin: 0,
});

const name = style({
  fontWeight: vars.fontWeight.semiBold,
});

const content = style({
  display: 'flex',
  flexDirection: 'column',
});

const elapsed = style([
  textXSmall,
  {
    marginTop: '5px',
    color: vars.color.grey400,
  },
]);

const button = style([
  textButton,
  {
    color: vars.color.grey400,
    margin: '20px 10px 0 10px',
    '@media': {
      [MediaQuery.Desktop]: {
        display: 'none',
      },
    },
  },
]);

const empty = style({
  '@media': {
    [MediaQuery.Desktop]: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
    },
    [MediaQuery.Mobile]: {
      display: 'none',
    },
  },
});

const emptyText = style([textXXSmall, { color: vars.color.grey400 }]);

const styles = {
  feed,
  item,
  comment,
  name,
  content,
  elapsed,
  button,
  empty,
  emptyText,
};

export default styles;
