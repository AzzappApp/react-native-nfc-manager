import { style } from '@vanilla-extract/css';
import { MediaQuery } from '../theme.css';

const background = style({
  backgroundColor: '#FFFFFF',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  alignSelf: 'center',
  width: '100%',
});

const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  alignSelf: 'center',
  marginTop: '70px',
  '@media': {
    [MediaQuery.Desktop]: {
      flex: 1,
      width: '500px',
    },
    [MediaQuery.Mobile]: {
      height: '100%',
      width: '100%',
      paddingTop: '40px',
      paddingBottom: '40px',
      paddingLeft: '50px',
      paddingRight: '50px',
    },
  },
});

const image = style({
  width: '150px',
  marginBottom: '70px',
});

const text = style({
  fontWeight: 400,
  fontFamily: 'Helvetica Neue',
  fontSize: '14px',
});

const title = style({
  fontWeight: 700,
  textAlign: 'center',
  fontFamily: 'Helvetica Neue',
  fontSize: '20px',
  marginBottom: '15px',
});

const openIcon = style({
  marginLeft: '20px',
  marginRight: '20px',
  width: '24px',
  height: '24px',
});

const button = style({
  margin: 20,
  width: '250px',
});

const stepText = style({
  color: 'rgba(161, 161, 165, 1)',
  fontFamily: 'Helvetica Neue',
  fontSize: '14px',
  fontWeight: 400,
});

const stepDesc = style({
  fontFamily: 'Helvetica Neue',
  fontSize: '14px',
  fontWeight: 400,
});

const separator = style({
  height: '1px',
  width: '100%',
  backgroundColor: 'rgba(226, 225, 227, 1)',
  marginTop: '10px',
  marginBottom: '20px',
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
      width: '500px',
    },
    [MediaQuery.Mobile]: {
      height: '100%',
      width: '100%',
    },
  },
});

const coverContainer = style({
  '@media': {
    [MediaQuery.Desktop]: {
      flex: 1,
      width: '200px',
    },
    [MediaQuery.Mobile]: {
      width: '35%',
    },
  },
});

const simpleContainer = style({
  '@media': {
    [MediaQuery.Desktop]: {
      flex: 1,
      width: '200px',
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

const simpleButton = style({
  height: 34,
  width: 125,
  padding: '10px, 15px, 10px, 15px',
  borderRadius: 48,
  border: '1px solid black',
  fontSize: 12,
  fontWeight: 'bold',
  flexDirection: 'row',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const tableFull = style({
  tableLayout: 'fixed',
  '@media': {
    [MediaQuery.Desktop]: {
      flex: 1,
      width: '450',
    },
    [MediaQuery.Mobile]: {
      height: '100%',
      width: '90%',
    },
  },
  paddingLeft: ' 15px',
  paddingRight: ' 15px',
  paddingTop: '20px',
  paddingBottom: ' 20px',
  background: 'white',
  borderRadius: ' 20px',
  overflow: 'hidden',
  gap: ' 15px',
  marginTop: 30,
});

const tableButton = style({
  height: '34px',
  width: '125px',
  paddingLeft: '10px',
  paddingRight: '10px',
  borderRadius: '48px',
  fontSize: '12px',
  marginTop: '12px',
});

const mobileImageTv = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  alignSelf: 'center',
  width: '97px',
  height: '97px',
  marginTop: '50px',
});

const mobileDescription = style({
  fontFamily: 'Helvetica Neue',
  fontSize: '14px',
  fontWeight: 400,
  textAlign: 'center',
});

const mobileMainDescription = style({
  fontFamily: 'Helvetica Neue',
  fontSize: '14px',
  fontWeight: 400,
  textAlign: 'center',
  height: '100px',
});

const mobileBodyContainer = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexDirection: 'column',
  marginLeft: 16,
  marginRight: 16,
});

const mobileStepDesc = style({
  fontFamily: 'Helvetica Neue',
  fontSize: '14px',
  fontWeight: 400,
  textAlign: 'center',
  paddingBottom: '30px',
});

const styles = {
  background,
  button,
  container,
  image,
  text,
  title,
  openIcon,
  stepText,
  stepDesc,
  separator,
  pageContainer,
  coverContainer,
  simpleContainer,
  simpleButton,
  tableFull,
  tableButton,
  mobileImageTv,
  mobileDescription,
  mobileMainDescription,
  mobileBodyContainer,
  mobileStepDesc,
};

export default styles;
