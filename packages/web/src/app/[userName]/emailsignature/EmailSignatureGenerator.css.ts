import { style } from '@vanilla-extract/css';
import { MediaQuery } from '../theme.css';

const title = style({
  fontWeight: 700,
  textAlign: 'center',
  fontFamily: 'Helvetica Neue',
  fontSize: 20,
  marginBottom: 50,
});

const tabBar = style({
  alignSelf: 'stretch',
});

const button = style({
  margin: 20,
  width: 250,
});

const pageContainer = style({
  flexDirection: 'row',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 70,
  '@media': {
    [MediaQuery.Desktop]: {
      flex: 1,
      width: 500,
    },
    [MediaQuery.Mobile]: {
      height: '100%',
      width: '100%',
    },
  },
});

const openIcon = style({
  marginLeft: 20,
  marginRight: 20,
  width: 24,
  height: 24,
});

const simpleContainer = style({
  '@media': {
    [MediaQuery.Desktop]: {
      flex: 1,
      width: 200,
    },
    [MediaQuery.Mobile]: {
      width: '35%',
    },
  },
  height: 320,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: '1px solid rgba(226, 225, 227, 1)',
  borderRadius: 18,
  borderStyle: 'dashed',
});

const text = style({
  fontWeight: 400,
  fontFamily: 'Helvetica Neue',
  fontSize: 14,
});

const styles = {
  title,
  tabBar,
  button,
  pageContainer,
  openIcon,
  simpleContainer,
  text,
};

export default styles;
