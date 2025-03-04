import { style } from '@vanilla-extract/css';
import { MediaQuery } from '../theme.css';

const styles = {
  container: style({
    margin: '0 auto',
    padding: '110px 50px 40px',
    width: '100%',
    maxWidth: '580px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    '@media': {
      [MediaQuery.Mobile]: {
        padding: '50px 20px 20px',
      },
    },
  }),
  logo: style({
    marginBottom: 50,
    '@media': {
      [MediaQuery.Mobile]: {
        marginBottom: 30,
      },
    },
  }),
  title: style({
    fontWeight: 700,
    textAlign: 'center',
    fontFamily: 'Helvetica Neue',
    fontSize: 20,
    marginBottom: 50,
    '@media': {
      [MediaQuery.Mobile]: {
        marginBottom: 30,
        fontSize: 16,
      },
    },
  }),
  description: style({
    fontWeight: 400,
    fontFamily: 'Helvetica Neue',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 30,
    '@media': {
      [MediaQuery.Mobile]: {
        marginTop: 20,
        marginBottom: 20,
      },
    },
  }),
};

export default styles;
