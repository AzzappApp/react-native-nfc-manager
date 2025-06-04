import { StyleSheet } from 'react-native';
import { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { colors } from '#theme';
import useAnimatedState from '#hooks/useAnimatedState';
import PressableOpacity from '#ui/PressableOpacity';
import Icon from '../Icon';
import Text from '../Text';
import type TabBarMenuItemProps from './TabBarMenuItemProps';

const TabBarMenuItem = ({
  selected,
  onPress,
  children,
  labelStyle,
  selectedBackgroundColor = colors.grey50,
  selectedLabelColor = colors.black,
  backgroundColor = `${colors.grey50}00`,
  icon,
  disabled,
  style,
}: TabBarMenuItemProps) => {
  const state = useAnimatedState(selected);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        state.value,
        [0, 1],
        [backgroundColor, selectedBackgroundColor],
      ),
    };
  });

  return (
    <PressableOpacity
      style={[styles.pressable, animatedStyle, style]}
      onPress={onPress}
      accessibilityRole="tab"
      disabled={disabled}
    >
      {icon && (
        <Icon
          icon={icon}
          style={[styles.icon, selected && { tintColor: selectedLabelColor }]}
        />
      )}
      <Text
        style={[labelStyle, selected && { color: selectedLabelColor }]}
        variant="button"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {children}
      </Text>
    </PressableOpacity>
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  icon: {
    width: 22,
    height: 22,
  },
});

export default TabBarMenuItem;
