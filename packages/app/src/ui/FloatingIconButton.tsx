import { forwardRef } from 'react';

import Icon from '#ui/Icon';
import FloatingButton from './FloatingButton';
import type { Icons } from '#ui/Icon';
import type { FloatingButtonProps } from './FloatingButton';
import type { ForwardedRef } from 'react';
import type { View } from 'react-native';

export type FloatingIconButtonProps = Omit<FloatingButtonProps, 'children'> & {
  icon: Icons;
  iconSize?: number;
};

const FloatingIconButton = (
  { icon, iconSize = 18, ...props }: FloatingIconButtonProps,
  ref: ForwardedRef<View>,
) => (
  <FloatingButton ref={ref} {...props}>
    <Icon
      icon={icon}
      style={[
        {
          width: iconSize,
          height: iconSize,
        },
      ]}
    />
  </FloatingButton>
);

export default forwardRef(FloatingIconButton);
