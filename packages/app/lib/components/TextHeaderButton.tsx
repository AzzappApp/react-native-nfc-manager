import { Pressable, StyleSheet, Text } from 'react-native';

type TextHeaderButtonProps = {
  text: string;
  onPress: () => void;
  whiteButton?: boolean;
};

const TextHeaderButton = ({
  text,
  onPress,
  whiteButton,
}: TextHeaderButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      whiteButton && styles.whiteButton,
      pressed && styles.buttonPressed,
    ]}
    hitSlop={{ left: 20, right: 20 }}
  >
    <Text style={[styles.text, whiteButton && styles.whiteButtonText]}>
      {text}
    </Text>
  </Pressable>
);

export default TextHeaderButton;

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  buttonPressed: {
    backgroundColor: '#AAA',
  },
  whiteButton: {
    backgroundColor: 'white',
  },
  text: {
    color: '#fff',
  },
  whiteButtonText: {
    color: '#000',
  },
});
