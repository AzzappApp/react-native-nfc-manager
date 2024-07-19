import { forwardRef } from 'react';
import FloatingButton from './FloatingButton';
import FloatingIconButton from './FloatingIconButton';
import type { FloatingButtonProps } from './FloatingButton';
import type { FloatingIconButtonProps } from './FloatingIconButton';
import type { ForwardedRef } from 'react';
import type { View } from 'react-native';

const BlurredFloatingButton = (
  props: FloatingButtonProps,
  ref: ForwardedRef<View>,
) => {
  return <FloatingButton ref={ref} {...props} />;
};

export default forwardRef(BlurredFloatingButton);

const BlurredFloatingIconButtonRef = (
  props: FloatingIconButtonProps,
  ref: ForwardedRef<View>,
) => {
  return <FloatingIconButton ref={ref} {...props} />;
};

export const BlurredFloatingIconButton = forwardRef(
  BlurredFloatingIconButtonRef,
);
