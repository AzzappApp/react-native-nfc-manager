import { style } from '@vanilla-extract/css';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';

const coverTextRender = style({
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
});

const converTextContainer = style({
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  padding: `${COVER_RATIO * 0.15 * 100}%`,
  display: 'flex',
  flexDirection: 'column',
  '@media': {
    'screen and (max-width: 375px)': {
      fontSize: '0.8vw',
    },
    'screen and (min-width: 376px)': {
      fontSize: '3px',
    },
  },
});

const converTextContainerVertical = style({
  width: `${100 / COVER_RATIO}%`,
  height: `${100 * COVER_RATIO}%`,
  top: `${(100 - 100 * COVER_RATIO) / 2}%`,
  left: `${(100 - 100 / COVER_RATIO) / 2}%`,
  paddingTop: '5%',
});

const converTextContainerTopToBottom = style({
  transform: 'rotate(90deg)',
  paddingLeft: '15%',
});

const converTextContainerBottomToTop = style({
  transform: 'rotate(-90deg)',
  paddingRight: '15%',
});

export default {
  coverTextRender,
  converTextContainer,
  converTextContainerVertical,
  converTextContainerTopToBottom,
  converTextContainerBottomToTop,
};
