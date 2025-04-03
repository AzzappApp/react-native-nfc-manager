import { style } from '@vanilla-extract/css';

export const shadowLightBottom = style({
  boxShadow: `0px 5px 10px 0px rgba(0, 0, 0, 0.2)`,
});

export const shadowDarkBottom = style({
  boxShadow: `0px 5px 10px 0px rgba(0, 0, 0, 0.4)`,
});

const styles = {
  shadowDarkBottom,
  shadowLightBottom,
};

export default styles;
