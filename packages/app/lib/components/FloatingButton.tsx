import { Pressable, StyleSheet } from 'react-native';
import type { ViewStyle, StyleProp, PressableProps } from 'react-native';

export type FloatingButtonProps = {
  onPress: () => void;
  size?: number;
  light?: boolean;
  style?: StyleProp<ViewStyle>;
  nativeID?: string;
  children: PressableProps['children'];
};

const FloatingButton = ({
  onPress,
  size = 50,
  style,
  children,
  light,
  nativeID,
}: FloatingButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      { minWidth: size, height: size, borderRadius: size / 2 },
      styles.button,
      light && styles.buttonLight,
      pressed && styles.buttonPressed,
      pressed && light && styles.buttonLightPressed,
      style,
    ]}
    nativeID={nativeID}
  >
    {children}
  </Pressable>
);

export default FloatingButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLight: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonLightPressed: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
