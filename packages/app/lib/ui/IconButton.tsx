import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import Icon from './Icon';
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
};

const IconButton = ({
  onPress,
  icon,
  iconSize = 18,
  size = 50,
  style,
  iconStyle,
  nativeID,
}: IconButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      { minWidth: size, height: size, borderRadius: size / 2 },
      styles.button,
      pressed && styles.buttonPressed,
      style,
    ]}
    nativeID={nativeID}
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
  </Pressable>
);

export default IconButton;

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.lightGrey,
  },
  image: {
    tintColor: colors.dark,
    resizeMode: 'contain',
  },
});
