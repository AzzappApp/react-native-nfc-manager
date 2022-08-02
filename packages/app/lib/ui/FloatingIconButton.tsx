import { StyleSheet } from 'react-native';
import Icon from '../ui/Icon';
import FloatingButton from './FloatingButton';
import type { Icons } from '../ui/Icon';
import type { FloatingButtonProps } from './FloatingButton';

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
