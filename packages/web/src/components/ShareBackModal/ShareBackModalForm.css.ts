import { style } from '@vanilla-extract/css';
import { textSmall, vars } from '#app/[userName]/theme.css';

const content = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  maxHeight: '100%',
  overflow: 'hidden',
});

const formFields = style({
  maxHeight: 'calc(100% - 140px)',
  overflowY: 'scroll',
  borderBottomStyle: 'solid',
  borderBottomWidth: '1px',
  borderBottomColor: vars.color.grey100,
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  '::-webkit-scrollbar': {
    display: 'none',
    width: '0 !important',
  },
  scrollbarWidth: 'none',
});

const formSpacingInner = style({
  padding: '10px 25px',
});

const form = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  maxHeight: 'calc(100% - 310px)',
  overflowY: 'auto',
  paddingBottom: 70,
});

const formFieldContainer = style([
  {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  formSpacingInner,
]);

const formFieldSeparator = style({
  borderBottomStyle: 'solid',
  borderBottomWidth: '1px',
  borderBottomColor: vars.color.grey100,
  selectors: {
    '&:last-child': {
      borderBottomWidth: 0,
    },
  },
});

const formField = style([formFieldContainer, formFieldSeparator]);

const formHasErrors = style({});
const formFieldError = style([
  {
    color: 'red',
    marginTop: '5px',
    padding: '10px 0',
    textAlign: 'center',
    boxShadow: '0 4px 8px -4px rgba(14, 14, 33, 0.2)',
    position: 'relative',

    opacity: 1,
    visibility: 'visible',
    transition: 'all 400ms cubic-bezier(.47,1.64,.41,.8)',
    height: 'auto',

    selectors: {
      [`:not(${formHasErrors})&`]: {
        opacity: 0,
        visibility: 'hidden',
        transform: 'translate(0,100%)',
        height: 0,
        padding: 0,
        boxShadow: 'none',
        marginTop: 0,
      },
    },
  },
  textSmall,
]);

const formInput = style({
  flexGrow: 1,
  backgroundColor: 'transparent',
  padding: 0,
  '::placeholder': {
    color: vars.color.grey200,
  },
  textOverflow: 'ellipsis',
  width: '100%',
});

const formButtonSuccess = style({ opacity: 1 });
const formButtonDisabled = style({ opacity: 0.3 });
const formButton = style({
  transition: 'all 400ms cubic-bezier(.47,1.64,.41,.8)',
  backgroundColor: vars.color.grey1000,
  borderRadius: 45,
  border: `2px solid ${vars.color.black}`,
  boxShadow: '0px 10px 10px 0px rgba(0, 0, 0, 0.20)',
  // mandatory to create an animation effect on the button width
  maxWidth: '325px',
  width: '80%',
  height: '47px',
  padding: 0,

  selectors: {
    [`&:not(${formButtonSuccess})`]: {
      width: '47px',
      height: '47px',
      borderRadius: '50%',
      margin: '25px auto 0',
      backgroundColor: vars.color.green,
      border: `2px solid ${vars.color.green}`,
    },
  },
});

const formButtonLabel = style({
  transition: 'all .1s',
  opacity: 0,
  visibility: 'hidden',

  selectors: {
    [`:not(${formButtonSuccess})&`]: {
      opacity: 1,
      visibility: 'visible',
    },
  },
});

const formButtonSuccessContainer = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '32px',
  height: '32px',
  fill: 'white',

  zIndex: 1,
  opacity: 1,
  visibility: 'visible',

  selectors: {
    [`:not(${formButtonSuccess})&`]: {
      opacity: 0,
      visibility: 'hidden',
      width: 0,
    },
  },
});

const formButtonSuccessSvg = style({
  width: '32px',
  height: '32px',
  opacity: 1,
  visibility: 'visible',
  transition: 'all 0.4s',

  selectors: {
    [`:not(${formButtonSuccess})&`]: {
      fill: 'white',
      transition: 'all 0.4',
      opacity: 0,
      visibility: 'hidden',
    },
  },
});

const formButtonContainer = style({
  position: 'absolute',
  bottom: 0,
  display: 'flex',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '15px 0px',
});

const styles = {
  content,
  formHasErrors,
  formFieldError,
  form,
  formFields,
  formField,
  formInput,
  formButton,
  formButtonSuccess,
  formButtonDisabled,
  formButtonLabel,
  formButtonSuccessContainer,
  formButtonSuccessSvg,
  formButtonContainer,
};

export default styles;
