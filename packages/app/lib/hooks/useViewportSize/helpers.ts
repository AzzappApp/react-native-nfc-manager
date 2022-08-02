export const VW100: unique symbol = Symbol('100vw');
export const VH100: unique symbol = Symbol('100vh');
export const insetTop: unique symbol = Symbol('insetTop');
export const insetBottom: unique symbol = Symbol('insetBottom');
export const insetLeft: unique symbol = Symbol('insetLeft');
export const insetRight: unique symbol = Symbol('insetRight');

export type Values =
  | number
  | typeof insetBottom
  | typeof insetLeft
  | typeof insetRight
  | typeof insetTop
  | typeof VH100
  | typeof VW100;
