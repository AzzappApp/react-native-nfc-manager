import { style } from '@vanilla-extract/css';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { MediaQuery } from '../../theme.css';

const styles = {
  simpleSignaturePreviewContainer: style({
    flexDirection: 'row',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media': {
      [MediaQuery.Desktop]: {
        flex: 1,
        width: 500,
      },
      [MediaQuery.Mobile]: {
        width: 200,
        flexDirection: 'column',
      },
    },
  }),
  coverContainer: style({
    width: 200,
    height: 200 / COVER_RATIO,
    border: '1px solid rgba(226, 225, 227, 1)',
  }),
  openIcon: style({
    marginLeft: 20,
    marginRight: 20,
    width: 24,
    height: 24,
    '@media': {
      [MediaQuery.Mobile]: {
        transform: 'rotate(90deg)',
      },
    },
  }),
  simpleSignatureContainer: style({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(226, 225, 227, 1)',
    borderRadius: 18,
    borderStyle: 'dashed',
    width: 200,
    '@media': {
      [MediaQuery.Desktop]: {
        height: 320,
      },
      [MediaQuery.Mobile]: {
        padding: 20,
      },
    },
  }),
  fullSignatureContainer: style({
    padding: '15px 20px',
    border: '1px solid #0E1216',
    borderRadius: 20,
    width: 500,
    '@media': {
      'screen and (max-width: 580px)': {
        zoom: 0.5,
      },
    },
  }),
};

export default styles;
