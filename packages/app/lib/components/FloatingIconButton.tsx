import { StyleSheet } from 'react-native';
import FloatingButton from './FloatingButton';
import Icon from './Icon';
import type { FloatingButtonProps } from './FloatingButton';
import type { Icons } from './Icon';

export type FloatingIconButtonProps = Omit<FloatingButtonProps, 'children'> & {
  icon: Icons;
  iconSize?: number;
};

const FloatingIconButton = ({
  icon,
  iconSize = 18,
  ...props
}: FloatingIconButtonProps) => (
  <FloatingButton {...props}>
    <Icon
      icon={icon}
      style={[
        styles.image,
        {
          width: iconSize,
          height: iconSize,
        },
      ]}
    />
  </FloatingButton>
);

export default FloatingIconButton;

const styles = StyleSheet.create({
  image: {
    tintColor: '#FFF',
    resizeMode: 'contain',
  },
});
