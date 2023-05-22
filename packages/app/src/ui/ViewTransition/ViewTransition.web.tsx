import { forwardRef } from 'react';
import { View } from 'react-native';
import type { ViewTransitionProps } from './viewTransitionTypes';
import type { ForwardedRef } from 'react';

const ViewTransition = (
  {
    transitions,
    transitionDuration,
    easing = 'linear',
    disableAnimation,
    style,
    ...props
  }: ViewTransitionProps,
  ref: ForwardedRef<View>,
) => {
  const transition = transitions
    .map(
      transitionKey =>
        `${jsToCSS(transitionKey)} ${transitionDuration}ms ${easing}`,
    )
    .join(',');
  const transitionStyle: any = disableAnimation ? 'none' : { transition };
  return <View ref={ref} style={[style, transitionStyle]} {...props} />;
};
export default forwardRef(ViewTransition);

const jsToCSS = (prop: string) => prop.replace(/([A-Z])/g, '-$1').toLowerCase();
