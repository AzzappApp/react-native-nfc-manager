import { memo } from 'react';
import {
  useColorScheme,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '#theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import Text from '#ui/Text';
import PressableNative from './PressableNative';
import type { ReactNode } from 'react';

type ToggleButtonProps = {
  label: string | null | undefined;
  toggled: boolean;
  variant?: 'primary' | 'rounded_menu';
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  rightElement?: ReactNode;
};

const ToggleButton = ({
  label,
  toggled,
  onPress,
  variant = 'primary',
  style = {},
  rightElement,
}: ToggleButtonProps) => {
  const colorScheme = useColorScheme();

  const styles = useVariantStyleSheet(
    styleSheet,
    variant,
    colorScheme ?? 'light',
  );

  return (
    <PressableNative
      onPress={onPress}
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: toggled }}
      style={[styles.container, toggled && styles.toggleContainer, style]}
    >
      <View style={styles.textContainer}>
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
        {rightElement}
      </View>
    </PressableNative>
  );
};

// Toggle button happens to be used in flatlist
export default memo(ToggleButton);

export const TOGGLE_BUTTON_HEIGHT = 35;

const styleSheet = createVariantsStyleSheet(appearance => ({
  default: {
    container: {
      height: TOGGLE_BUTTON_HEIGHT,
      borderRadius: 100,
      borderWidth: 1,
      overflow: 'hidden',
    },
    textContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
      paddingLeft: 20,
      paddingRight: 20,
    },
  },
  primary: {
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
  },
  rounded_menu: {
    container: {
      borderColor: appearance === 'light' ? colors.grey50 : colors.grey900,
      backgroundColor: appearance === 'light' ? colors.white : colors.black,
    },
    toggleContainer: {
      backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
    },
    toggleLabel: {
      color: appearance === 'light' ? colors.black : colors.white,
    },
  },
}));
