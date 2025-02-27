import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Icon from './Icon';
import PressableOpacity from './PressableOpacity';
import type { Icons } from './Icon';
import type { PressableOpacityProps } from './PressableOpacity';
import type { StyleProp, ImageStyle, ViewProps } from 'react-native';

export type IconButtonProps = PressableOpacityProps &
  ViewProps & {
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
    // TODO unfortunately, we can't use PressableNative here because of the ripple effect, see : https://github.com/facebook/react-native/issues/34553
    <PressableOpacity
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
      <Icon icon={icon} size={iconSize} style={iconStyle} />
    </PressableOpacity>
  );
};

export default IconButton;

const computedStyle = createVariantsStyleSheet(appearance => ({
  default: {
    button: {
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  icon: {},
  border: {
    button: {
      borderWidth: 1,
      borderColor: appearance === 'light' ? '#000000' : '#ffffff',
    },
  },
}));
