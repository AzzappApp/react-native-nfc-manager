import { StyleSheet } from 'react-native';
import { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { colors } from '#theme';
import useAnimatedState from '#hooks/useAnimatedState';
import Icon from './Icon';
import PressableAnimated from './PressableAnimated';
import Text from './Text';
import type { Icons } from './Icon';
import type { PropsWithChildren } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

const TabBarMenuItem = ({
  selected,
  setSelected,
  children,
  labelStyle,
  containerStyle,
  selectedBackgroundColor = colors.grey50,
  backgroundColor = `${colors.grey50}00`,
  icon,
}: PropsWithChildren<{
  selected: boolean;
  setSelected: () => void;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  selectedBackgroundColor?: string;
  backgroundColor?: string;
  icon?: Icons;
}>) => {
  const state = useAnimatedState(selected);
  const style = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        state.value,
        [0, 1],
        [backgroundColor, selectedBackgroundColor],
      ),
    };
  }, [state]);

  return (
    <PressableAnimated
      style={[styles.pressable, containerStyle, style]}
      onPress={setSelected}
      accessibilityRole="tab"
    >
      {icon && <Icon icon={icon} style={styles.icon} />}
      <Text
        style={[labelStyle, selected && { color: colors.black }]}
        variant="button"
      >
        {children}
      </Text>
    </PressableAnimated>
  );
};
export const TAB_BAR_MENU_ITEM_HEIGHT = 32;

const styles = StyleSheet.create({
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 16,
    height: TAB_BAR_MENU_ITEM_HEIGHT,
    gap: 10,
  },
  icon: {
    width: 22,
    height: 22,
  },
});

export default TabBarMenuItem;
