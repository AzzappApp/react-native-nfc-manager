import { style } from '@vanilla-extract/css';
import { textXSmall, vars } from '#app/theme.css';

const stepContainer = style({
  display: 'flex',
  gap: 5,
});

const step = style([
  textXSmall,
  {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
    borderRadius: 77,
    backgroundColor: vars.color.grey50,
    color: vars.color.black,
  },
]);

const activeStep = style({
  backgroundColor: vars.color.black,
  color: vars.color.white,
});

const styles = {
  stepContainer,
  step,
  activeStep,
};

export default styles;
