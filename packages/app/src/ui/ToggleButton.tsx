import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableBackground from '#ui/PressableBackground';
import Text from '#ui/Text';
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
  const appearanceStyle = useStyleSheet(computedStyle);
  return (
    <PressableBackground
      onPress={onPress}
      highlightColor={undefined}
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: toggled }}
      style={[
        styles.container,
        appearanceStyle.container,
        toggled && appearanceStyle.toggleContainer,
        style,
      ]}
    >
      <Text
        variant="button"
        style={[
          {
            textAlignVertical: 'center',
          },
          toggled && appearanceStyle.toggleLabel,
        ]}
      >
        {label}
      </Text>
    </PressableBackground>
  );
};

// Toggle button happens to be used in flatlist
export default memo(ToggleButton);

export const TOGGLE_BUTTON_HEIGHT = 35;
const computedStyle = createStyleSheet(appearance => ({
  container: {
    borderColor: appearance === 'light' ? colors.black : colors.white,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  toggleContainer: {
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  toggleLabel: {
    color: appearance === 'light' ? colors.white : colors.black,
  },
}));
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
