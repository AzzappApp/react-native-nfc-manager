import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontFamilies } from '../../theme';
import type { StyleProp, ViewProps } from 'react-native';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewProps>;
};

const Button = ({ onPress, label, style }: ButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      pressed && styles.buttonPressed,
      style,
    ]}
  >
    <Text style={styles.label}>{label}</Text>
  </Pressable>
);

export default Button;

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.dark,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonPressed: {
    backgroundColor: colors.grey200,
  },
  label: {
    ...fontFamilies.semiBold,
    fontSize: 14,
    color: '#fff',
  },
});
