import { StyleSheet, Text } from 'react-native';
import { textStyles } from '../../theme';
import PressableNative from './PressableNative';

type TextHeaderButtonProps = {
  text: string;
  onPress: () => void;
};

const TextHeaderButton = ({ text, onPress }: TextHeaderButtonProps) => (
  <PressableNative
    onPress={onPress}
    style={styles.button}
    hitSlop={{ left: 20, right: 20 }}
  >
    <Text style={textStyles.button}>{text}</Text>
  </PressableNative>
);

export default TextHeaderButton;

const styles = StyleSheet.create({
  button: {
    padding: 10,
  },
});
