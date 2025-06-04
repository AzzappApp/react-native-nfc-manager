import { style } from '@vanilla-extract/css';
import { textLarge, textSmall, vars } from '#app/theme.css';

const content = style({
  paddingTop: '20px',
  position: 'relative',
});

const header = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingBottom: '20px',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: vars.color.grey100,
});

const title = style([textLarge]);

const options = style({
  display: 'flex',
  flexDirection: 'row',
  gap: '25px',
  overflowX: 'scroll',
  '::-webkit-scrollbar': {
    display: 'none',
    width: '0 !important',
  },
  scrollbarWidth: 'none',
  paddingLeft: '25px',
  paddingRight: '25px',
});

const option = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const optionName = style([textSmall]);

const copy = style({
  marginTop: '25px',
  marginLeft: '20px',
  marginRight: '20px',
  position: 'relative',
  height: '47px',
});

const link = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
});

const copyButton = style({
  position: 'absolute',
  right: 0,
});

const icon = style({
  backgroundColor: vars.color.grey50,
  borderRadius: '40px',
  marginBottom: '5px',
});

const navigation = style({
  opacity: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: vars.color.black,
  borderRadius: '40px',
  position: 'absolute',
  top: '30px',
  transition: 'visibility 0.3s, opacity 0.3s',
});

const navigationLeft = style({
  left: '20px',
  transform: 'rotate(180deg)',
});

const navigationRight = style({
  right: '20px',
});

const navigationHidden = style({
  visibility: 'hidden',
  opacity: 0,
});

const styles = {
  content,
  header,
  title,
  options,
  option,
  optionName,
  copy,
  icon,
  navigation,
  navigationLeft,
  navigationRight,
  navigationHidden,
  link,
  copyButton,
};

export default styles;
