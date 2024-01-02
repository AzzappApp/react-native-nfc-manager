import { style } from '@vanilla-extract/css';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { MediaQuery } from '#app/theme.css';

const coverTextRender = style({
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
});

const coverTextContentContainer = style({
  overflow: 'hidden',
});

const coverTextContent = style({
  position: 'relative',
  overflow: 'hidden',
  margin: 0,
  '@media': {
    [MediaQuery.Mobile]: {
      fontSize: '0.8vw',
    },
    [MediaQuery.Desktop]: {
      fontSize: '3px',
    },
  },
});

const coverTextContainer = style({
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  padding: '5%',
  display: 'flex',
  flexDirection: 'column',
});

const coverTextContainerVertical = style({
  width: `${100 / COVER_RATIO}%`,
  height: `${100 * COVER_RATIO}%`,
  top: `${(100 - 100 * COVER_RATIO) / 2}%`,
  left: `${(100 - 100 / COVER_RATIO) / 2}%`,
});

const coverTextContainerHorizontal = style({
  paddingTop: '15%',
});

const coverTextContainerTopToBottom = style({
  transform: 'rotate(90deg)',
  paddingLeft: '15%',
});

const coverTextContainerBottomToTop = style({
  transform: 'rotate(-90deg)',
  paddingRight: '15%',
});

const coverTextLetter = style({
  display: 'inline-block',
  position: 'relative',
});

export default {
  coverTextRender,
  coverTextContent,
  coverTextContentContainer,
  coverTextContainer,
  coverTextContainerVertical,
  coverTextContainerHorizontal,
  coverTextContainerTopToBottom,
  coverTextContainerBottomToTop,
  coverTextLetter,
};
