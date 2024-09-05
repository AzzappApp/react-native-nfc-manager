import { style } from '@vanilla-extract/css';

const container = style({
  height: 100,
  width: '100%',
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: '0 10px 0 10px',
  transition: 'height 0.25s ease-in',
  backgroundColor: 'white',
  overflow: 'hidden',
});

const containerHidden = style({
  height: 0,
});

const logo = style({
  height: 63,
  width: 63,
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: 15,
  borderColor: '#E7E7E7',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 15,
});

const texts = style({
  marginLeft: 10,
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
});

const title = style({
  fontSize: 16,
  fontWeight: 400,
  lineHeight: '24px',
});

const subTitle = style({
  fontSize: 12,
  color: '#A5A5A5',
});

const link = style({
  color: '#2E81FF',
  fontSize: 15,
  fontWeight: 600,
});

const styles = {
  container,
  containerHidden,
  logo,
  texts,
  title,
  subTitle,
  link,
};

export default styles;
