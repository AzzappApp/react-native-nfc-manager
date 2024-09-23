import { style } from '@vanilla-extract/css';
import { MediaQuery, textButton, vars } from '#app/[userName]/theme.css';

const seeMore = style({
  width: '100%',
  '@media': {
    [MediaQuery.Desktop]: {
      maxWidth: '850px',
      margin: '0 50px 0 50px',
    },
    [MediaQuery.Mobile]: {
      padding: '0 10px 10px 10px',
    },
  },
});

const button = style([textButton, { color: vars.color.grey400 }]);

const comment = style({
  marginTop: '30px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  '@media': {
    [MediaQuery.Desktop]: {
      display: 'none',
    },
  },
});

const publications = style({
  '@media': {
    [MediaQuery.Mobile]: {
      paddingLeft: '10px',
      paddingRight: '10px',
    },
  },
});

const publicationsText = style([
  textButton,
  {
    '@media': {
      [MediaQuery.Mobile]: {
        margin: '50px 0 30px 0',
      },
      [MediaQuery.Desktop]: {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
    },
  },
]);

const name = style({
  fontWeight: vars.fontWeight.extraBold,
});

const mediaGap = 20;
const mediaCountPerLine = 3;
const mediaWidthPercent = 100 / mediaCountPerLine;
const mediaWidthMarginPx =
  (mediaGap * (mediaCountPerLine - 1)) / mediaCountPerLine;

const medias = style({
  display: 'flex',
  gap: `${mediaGap}px`,
  '@media': {
    [MediaQuery.Mobile]: {
      flexDirection: 'column',
    },
    [MediaQuery.Desktop]: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
  },
});

const media = style({
  position: 'relative',
  borderRadius: '20px',
  overflow: 'hidden',
  height: 'fit-content',
  '@media': {
    [MediaQuery.Mobile]: {
      width: '100%',
    },
    [MediaQuery.Desktop]: {
      width: `calc(${mediaWidthPercent}% - ${mediaWidthMarginPx}px)`,
      marginTop: '20px',
      cursor: 'pointer',
    },
  },
});

const styles = {
  seeMore,
  button,
  comment,
  publications,
  publicationsText,
  name,
  medias,
  media,
};

export default styles;
