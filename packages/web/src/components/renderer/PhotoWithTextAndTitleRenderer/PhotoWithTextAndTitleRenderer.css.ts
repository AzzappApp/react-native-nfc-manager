import { style, createVar } from '@vanilla-extract/css';
import { MediaQuery } from '#app/theme.css';

export const wrapperMarginTop = createVar();

const wrapper = style({
  display: 'flex',
  '@media': {
    [MediaQuery.BelowSmallMobile]: {
      marginTop: wrapperMarginTop,
    },
  },
});

const wrapperArrangmentTop = style({
  '@media': {
    'screen and (max-width: 639.9px)': {
      flexDirection: 'column',
    },
  },
});

const wrapperArrangmentBottom = style({
  '@media': {
    [MediaQuery.BelowSmallMobile]: {
      flexDirection: 'column-reverse',
    },
  },
});

const wrapperArrangmentLeft = style({
  '@media': {
    [MediaQuery.AtLeastSmallMobile]: {
      flexDirection: 'row',
    },
  },
});

const wrapperArrangmentRight = style({
  '@media': {
    [MediaQuery.AtLeastSmallMobile]: {
      flexDirection: 'row-reverse',
    },
  },
});

const text = style({
  '@media': {
    [MediaQuery.BelowSmallMobile]: {
      marginTop: '0!important',
      maxWidth: '100%!important',
    },
  },
});

const sectionImage = style({
  '@media': {
    [MediaQuery.AtLeastSmallMobile]: {
      display: 'flex',
      flexDirection: 'row',
      width: '50%',
      justifyContent: 'flex-start',
    },
    [MediaQuery.BelowSmallMobile]: {
      maxWidth: '100%',
    },
  },
});

const sectionText = style({
  '@media': {
    [MediaQuery.AtLeastSmallMobile]: {
      display: 'flex',
      flexDirection: 'row',
      width: '50%',
      alignItems: 'center',
      selectors: {
        [`${wrapperArrangmentLeft} &`]: {
          justifyContent: 'flex-start',
        },
        [`${wrapperArrangmentRight} &`]: {
          justifyContent: 'flex-end',
        },
      },
    },
    [MediaQuery.BelowSmallMobile]: {
      maxWidth: '100%',
    },
  },
});

const styles = {
  wrapper,
  wrapperArrangmentTop,
  wrapperArrangmentBottom,
  wrapperArrangmentLeft,
  wrapperArrangmentRight,
  text,
  sectionImage,
  sectionText,
};

export default styles;
