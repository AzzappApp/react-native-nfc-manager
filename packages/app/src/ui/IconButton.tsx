import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Icon from './Icon';
import PressableNative from './PressableNative';
import type { Icons } from './Icon';
import type { StyleProp, ImageStyle, ViewProps } from 'react-native';

export type IconButtonProps = ViewProps & {
  icon: Icons;
  /**
   * Size of the icon
   *
   * @type {number}
   */
  iconSize?: number;
  /**
   * Size of the container
   *
   * @type {number}
   */
  size?: number;
  /**
   *Action to call when pressing the icon
   *
   */
  onPress?: () => void;
  /**
   * style of the icon
   *
   * @type {StyleProp<ImageStyle>}
   */
  iconStyle?: StyleProp<ImageStyle>;
  /**
   * @default 'border' like define in the Styleguide. with a border circle around
   * icon :a simple version close to icon, without border and extra padding
   *
   * @type {('border' | 'icon')}
   */
  variant?: 'border' | 'icon';
  /**
   * @see https://reactnative.dev/docs/pressable#disabled
   */
  disabled?: boolean;
};

const IconButton = ({
  onPress,
  icon,
  iconSize = 24,
  size,
  style,
  iconStyle,
  variant = 'border',
  ...props
}: IconButtonProps) => {
  const styles = useVariantStyleSheet(computedStyle, variant);
  const variantSize = size ? size : variant === 'border' ? 50 : iconSize;
  return (
    <PressableNative
      {...props}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        {
          minWidth: variantSize,
          height: variantSize,
          borderRadius: variantSize / 2,
        },
        styles.button,
        style,
      ]}
      {...props}
    >
      <Icon
        icon={icon}
        style={[
          styles.image,
          iconStyle,
          {
            width: iconSize,
            height: iconSize,
          },
        ]}
      />
    </PressableNative>
  );
};

export default IconButton;

const computedStyle = createVariantsStyleSheet(() => ({
  default: {
    image: {
      resizeMode: 'contain',
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  icon: {},
  border: {
    button: {
      borderWidth: 1,
    },
  },
}));
