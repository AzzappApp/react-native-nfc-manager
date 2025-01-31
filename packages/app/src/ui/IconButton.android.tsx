import { type StyleProp, type ImageStyle, type ViewProps } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Icon from './Icon';
import type { Icons } from './Icon';

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

  hitSlop?: number;
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
    <TouchableOpacity
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
    </TouchableOpacity>
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
