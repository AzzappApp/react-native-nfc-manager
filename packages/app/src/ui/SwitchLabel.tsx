import { StyleSheet, View } from 'react-native';
import Text from '#ui/Text';
import Switch from './Switch';
import type { SwitchProps } from './Switch';
import type { StyleProp, ViewStyle } from 'react-native';

type SwitchLabelProps = Omit<SwitchProps, 'style'> & {
  /**
   * The label text to display.
   */
  label: string;
  /**
   * The style of the container
   */
  style?: StyleProp<ViewStyle> | undefined;
  /**
   * The style of the switch component
   */
  switchStyle?: StyleProp<ViewStyle> | undefined;
  /**
   * The native id of the label (used for accessibility)
   */
  labelID?: string;
};

const SwitchLabel = ({ label, style, labelID, ...props }: SwitchLabelProps) => {
  return (
    <View style={[styles.root, style]}>
      <Switch
        {...props}
        accessibilityRole="switch"
        accessibilityState={{ selected: props.value, disabled: props.disabled }}
        accessibilityLabelledBy={labelID}
      />
      <Text variant="smallbold" style={styles.text} nativeID={labelID}>
        {label}
      </Text>
    </View>
  );
};

export default SwitchLabel;

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 10,
  },
});
