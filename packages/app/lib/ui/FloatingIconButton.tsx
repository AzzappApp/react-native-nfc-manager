import { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { colors } from '../theme';
import Icon from '../ui/Icon';
import FloatingButton from './FloatingButton';
import type { Icons } from '../ui/Icon';
import type { FloatingButtonProps } from './FloatingButton';
import type { ForwardedRef } from 'react';
import type { View } from 'react-native';

export type FloatingIconButtonProps = Omit<FloatingButtonProps, 'children'> & {
  icon: Icons;
  iconSize?: number;
};

const FloatingIconButton = (
  {
    icon,
    iconSize = 18,
    variant = 'default',
    ...props
  }: FloatingIconButtonProps,
  ref: ForwardedRef<View>,
) => (
  <FloatingButton ref={ref} variant={variant} {...props}>
    <Icon
      icon={icon}
      style={[
        styles.image,
        variant !== 'default' && styles.imageLight,
        {
          width: iconSize,
          height: iconSize,
        },
      ]}
    />
  </FloatingButton>
);

export default forwardRef(FloatingIconButton);

const styles = StyleSheet.create({
  image: {
    tintColor: '#FFF',
    resizeMode: 'contain',
  },
  imageLight: {
    tintColor: colors.black,
  },
});
