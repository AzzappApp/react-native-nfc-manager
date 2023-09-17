import { forwardRef } from 'react';

import Icon from '#ui/Icon';
import FloatingButton from './FloatingButton';
import type { Icons } from '#ui/Icon';
import type { FloatingButtonProps } from './FloatingButton';
import type { ForwardedRef } from 'react';
import type { ImageStyle, StyleProp, View } from 'react-native';

export type FloatingIconButtonProps = Omit<FloatingButtonProps, 'children'> & {
  icon: Icons;
  iconSize?: number;
  iconStyle?: StyleProp<ImageStyle> | undefined;
};

const FloatingIconButton = (
  { icon, iconSize = 18, iconStyle, ...props }: FloatingIconButtonProps,
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
        iconStyle,
      ]}
    />
  </FloatingButton>
);

export default forwardRef(FloatingIconButton);
