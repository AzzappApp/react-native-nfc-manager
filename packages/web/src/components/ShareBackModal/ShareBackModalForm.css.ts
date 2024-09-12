import { style } from '@vanilla-extract/css';
import { textSmall, vars } from '#app/[userName]/theme.css';

const content = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  maxHeight: '100%',
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
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  maxHeight: 'calc(100vh - 310px)',
  overflowY: 'auto',
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
});

const formButtonSuccess = style({});
const formButton = style({
  margin: '25px auto 0',
  transition: 'all 400ms cubic-bezier(.47,1.64,.41,.8)',
  border: 0,
  // mandatory to create an animation effect on the button width
  maxWidth: '325px',
  width: '80%',
  height: '47px',

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
  marginTop: '50%',
  marginLeft: '-110%',
  width: '32px',
  height: '32px',
  opacity: 1,
  visibility: 'visible',
  transform: 'translateY(-50%) scale(1)',
  transition: 'all 0.4s',

  selectors: {
    [`:not(${formButtonSuccess})&`]: {
      fill: 'white',
      transformOrigin: '50% 50%',
      transform: 'translateY(-100%) rotate(0deg) scale(0)',
      transition: 'all 0.4',
      opacity: 0,
      visibility: 'hidden',
    },
  },
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
  formButtonLabel,
  formButtonSuccessContainer,
  formButtonSuccessSvg,
};

export default styles;
