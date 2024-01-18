import { style } from '@vanilla-extract/css';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { MediaQuery } from '#app/[userName]/theme.css';

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
      fontSize: '2.4px',
    },
  },
});

const coverTextContainerStyle = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  right: 0, //we prefer to use right instead of left, because on /api/cover we use left padding to keep ratio
  padding: '5%',
  display: 'flex',
  flexDirection: 'column',
} as const;

const coverTextContainer = style(coverTextContainerStyle);

const coverTextContainerVerticalStyle = {
  width: `${100 / COVER_RATIO}%`,
  height: `${100 * COVER_RATIO}%`,
  top: `${(100 - 100 * COVER_RATIO) / 2}%`,
  left: `${(100 - 100 / COVER_RATIO) / 2}%`,
};

const coverTextContainerVertical = style(coverTextContainerVerticalStyle);

const coverTextContainerHorizontalStyle = {
  paddingTop: '15%',
};

const coverTextContainerHorizontal = style(coverTextContainerHorizontalStyle);

const coverTextContainerTopToBottomStyle = {
  transform: 'rotate(90deg)',
  paddingLeft: '15%',
};

const coverTextContainerTopToBottom = style(coverTextContainerTopToBottomStyle);

const coverTextContainerBottomToTopStyle = {
  transform: 'rotate(-90deg)',
  paddingRight: '15%',
};

const coverTextContainerBottomToTop = style(coverTextContainerBottomToTopStyle);

const coverTextLetter = style({
  display: 'inline-block',
  position: 'relative',
});

export default {
  coverTextRender,
  coverTextContent,
  coverTextContentContainer,
  coverTextContainer,
  coverTextContainerStyle,
  coverTextContainerVertical,
  coverTextContainerVerticalStyle,
  coverTextContainerHorizontal,
  coverTextContainerHorizontalStyle,
  coverTextContainerTopToBottom,
  coverTextContainerTopToBottomStyle,
  coverTextContainerBottomToTop,
  coverTextContainerBottomToTopStyle,
  coverTextLetter,
};
