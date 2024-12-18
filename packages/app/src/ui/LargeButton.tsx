import { useColorScheme } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { Icons } from '#ui/Icon';
import type { ColorSchemeName, ViewStyle } from 'react-native';

const LargeButton = ({
  onPress,
  appearance,
  icon,
  title,
  style,
}: {
  onPress: () => void;
  appearance?: ColorSchemeName;
  icon: Icons;
  title: string;
  style?: ViewStyle;
}) => {
  const scheme = useColorScheme();
  const colorScheme = appearance || scheme;
  const styles = useStyleSheet(styleSheet, colorScheme);

  return (
    <PressableNative
      ripple={{
        foreground: true,
        color: colorScheme === 'dark' ? colors.grey100 : colors.grey900,
      }}
      accessibilityRole="button"
      style={[styles.button, style]}
      onPress={onPress}
    >
      <Icon
        icon={icon}
        style={styles.icon}
        size={24}
        tintColor={colorScheme === 'dark' ? colors.black : colors.white}
      />
      <Text variant="button" style={styles.text}>
        {title}
      </Text>
    </PressableNative>
  );
};

export default LargeButton;

const styleSheet = createStyleSheet(appearance => ({
  icon: {
    position: 'absolute',
    left: 10,
    marginVertical: 'auto',
  },
  button: {
    width: '100%',
    height: 47,
    borderRadius: 12,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: appearance === 'light' ? colors.white : colors.black,
  },
}));
