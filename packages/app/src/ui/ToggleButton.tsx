import { memo } from 'react';
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
  const styles = useStyleSheet(styleSheet);
  return (
    <PressableBackground
      onPress={onPress}
      highlightColor={undefined}
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: toggled }}
      style={[styles.container, toggled && styles.toggleContainer, style]}
    >
      <Text
        variant="button"
        style={[
          {
            textAlignVertical: 'center',
          },
          toggled && styles.toggleLabel,
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

const styleSheet = createStyleSheet(appearance => ({
  container: {
    paddingLeft: 20,
    paddingRight: 20,
    height: TOGGLE_BUTTON_HEIGHT,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
