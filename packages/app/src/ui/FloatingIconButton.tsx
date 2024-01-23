import { forwardRef } from 'react';

import Icon from '#ui/Icon';
import ActivityIndicator from './ActivityIndicator';
import FloatingButton from './FloatingButton';
import type { Icons } from '#ui/Icon';
import type { FloatingButtonProps } from './FloatingButton';
import type { ForwardedRef } from 'react';
import type { ImageStyle, StyleProp, View } from 'react-native';

export type FloatingIconButtonProps = Omit<FloatingButtonProps, 'children'> & {
  icon: Icons;
  loading?: boolean;
  iconSize?: number;
  iconStyle?: StyleProp<ImageStyle> | undefined;
};

const FloatingIconButton = (
  {
    icon,
    loading,
    iconSize = 18,
    iconStyle,
    ...props
  }: FloatingIconButtonProps,
  ref: ForwardedRef<View>,
) => (
  <FloatingButton disabled={loading} ref={ref} {...props}>
    {loading ? (
      <ActivityIndicator />
    ) : (
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
    )}
  </FloatingButton>
);

export default forwardRef(FloatingIconButton);
