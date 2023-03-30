import { StyleSheet, Text } from 'react-native';
import { colors, textStyles } from '#theme';
import PressableBackground from '#ui/PressableBackground';
import type { StyleProp, ViewStyle } from 'react-native';

type ToggleButtonProps = {
  label: string | null | undefined;
  toggled: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const ToggleButton = ({
  label,
  toggled,
  onPress,
  style = {},
}: ToggleButtonProps) => {
  return (
    <PressableBackground
      onPress={onPress}
      highlightColor={undefined}
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: toggled }}
      style={[
        styles.container,
        toggled
          ? { backgroundColor: colors.black }
          : { backgroundColor: 'transparent' },
        style,
      ]}
    >
      <Text
        style={{
          ...textStyles.button,
          textAlignVertical: 'center',
          color: toggled ? 'white' : colors.black,
        }}
      >
        {label}
      </Text>
    </PressableBackground>
  );
};

export default ToggleButton;

export const TOGGLE_BUTTON_HEIGHT = 35;

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
    paddingRight: 20,
    height: TOGGLE_BUTTON_HEIGHT,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
