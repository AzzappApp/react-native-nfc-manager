import { forwardRef } from 'react';
import { Pressable } from 'react-native';
import ViewTransition from './ViewTransition';
import type { ViewTransitionProps } from './ViewTransition/helpers';
import type { ForwardedRef } from 'react';
import type { PressableProps, View } from 'react-native';

const PressableTransition = (
  props: Pick<
    ViewTransitionProps,
    'easing' | 'transitionDuration' | 'transitions'
  > &
    PressableProps,
  ref: ForwardedRef<View>,
) => (
  // @ts-expect-error react-native monkey patch
  <Pressable {...props} ref={ref} ViewComponent={ViewTransition} />
);

export default forwardRef(PressableTransition);
