import { forwardRef } from 'react';
import FloatingButton from './FloatingButton';
import FloatingIconButton from './FloatingIconButton';
import type { FloatingButtonProps } from './FloatingButton';
import type { FloatingIconButtonProps } from './FloatingIconButton';

const BlurredFloatingButton = (props: FloatingButtonProps) => {
  return <FloatingButton {...props} />;
};

export default forwardRef(BlurredFloatingButton);

const BlurredFloatingIconButtonRef = (props: FloatingIconButtonProps) => {
  return <FloatingIconButton {...props} />;
};

export const BlurredFloatingIconButton = forwardRef(
  BlurredFloatingIconButtonRef,
);
