import { Pressable, StyleSheet, Text } from 'react-native';
import { textStyles } from '../../theme';

type TextHeaderButtonProps = {
  text: string;
  onPress: () => void;
};

const TextHeaderButton = ({ text, onPress }: TextHeaderButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    hitSlop={{ left: 20, right: 20 }}
  >
    <Text style={textStyles.button}>{text}</Text>
  </Pressable>
);

export default TextHeaderButton;

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 20,
  },
  buttonPressed: {
    backgroundColor: '#AAA',
  },
});
