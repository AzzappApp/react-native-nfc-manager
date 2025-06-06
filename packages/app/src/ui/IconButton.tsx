import {
  type StyleProp,
  type ImageStyle,
  type ViewProps,
  type ColorSchemeName,
  View,
} from 'react-native';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Icon from './Icon';
import PressableNative from './PressableNative';
import type { Icons } from './Icon';
import type { PressableOpacityProps } from './PressableOpacity';

export type IconButtonProps = Pick<
  PressableOpacityProps,
  'disabled' | 'disabledOpacity'
> &
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

    appearance?: ColorSchemeName;
  };

const IconButton = ({
  onPress,
  icon,
  iconSize = 24,
  size,
  style,
  iconStyle,
  variant = 'border',
  appearance,
  ...props
}: IconButtonProps) => {
  const styles = useVariantStyleSheet(computedStyle, variant, appearance);
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
          aspectRatio: 1,
        },
        style,
      ]}
      android_ripple={{
        borderless: true,
      }}
      {...props}
    >
      <View style={[styles.button, { borderRadius: variantSize / 2 }]}>
        <Icon
          icon={icon}
          size={iconSize}
          style={iconStyle}
          appearance={appearance}
        />
      </View>
    </PressableNative>
  );
};

export default IconButton;

const computedStyle = createVariantsStyleSheet(appearance => ({
  default: {
    button: {
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      width: '100%',
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
