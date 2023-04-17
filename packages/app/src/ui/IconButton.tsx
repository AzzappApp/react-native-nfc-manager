import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from './Icon';
import PressableNative from './PressableNative';
import type { Icons } from './Icon';
import type { StyleProp, ViewStyle, ImageStyle } from 'react-native';

export type IconButtonProps = {
  icon: Icons;
  iconSize?: number;
  size?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
  nativeID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

const IconButton = ({
  onPress,
  icon,
  iconSize = 24,
  size = 50,
  style,
  iconStyle,
  nativeID,
  accessibilityLabel,
  accessibilityHint,
}: IconButtonProps) => {
  const styles = useStyleSheet(computedStyle);
  return (
    <PressableNative
      accessibilityRole="button"
      onPress={onPress}
      style={[
        { minWidth: size, height: size, borderRadius: size / 2 },
        styles.button,
        style,
      ]}
      nativeID={nativeID}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
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

const computedStyle = createStyleSheet(appearance => ({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: appearance === 'dark' ? colors.white : colors.black,
    borderWidth: 1,
    borderRadius: 25,
  },
  image: {
    resizeMode: 'contain',
  },
}));
