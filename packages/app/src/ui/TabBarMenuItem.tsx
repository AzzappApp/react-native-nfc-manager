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

type TabBarMenuItemProps = PropsWithChildren<{
  /**
   * determine is the item is selected
   *
   * @type {boolean}
   */
  selected: boolean;
  /**
   * callback to select the time
   *
   */
  setSelected: () => void;
  /**
   * style of the label
   *
   * @type {StyleProp<TextStyle>}
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * container style
   *
   * @type {StyleProp<ViewStyle>}
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * optional props to define the selectedBackgroundColor
   *
   * @type {string}
   */
  selectedBackgroundColor?: string;
  /**
   * optional props to define the selectedTextColor. This will for now be applied also to the icon if use
   *
   * @type {string}
   */
  selectedLabelColor?: string;
  /**
   * backgroundColor
   *
   * @type {string}
   */
  backgroundColor?: string;
  /**
   * icons
   *
   * @type {Icons}
   */
  icon?: Icons;
}>;

const TabBarMenuItem = ({
  selected,
  setSelected,
  children,
  labelStyle,
  containerStyle,
  selectedBackgroundColor = colors.grey50,
  selectedLabelColor = colors.black,
  backgroundColor = `${colors.grey50}00`,
  icon,
}: TabBarMenuItemProps) => {
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
      {icon && (
        <Icon
          icon={icon}
          style={[styles.icon, selected && { tintColor: selectedLabelColor }]}
        />
      )}
      <Text
        style={[labelStyle, selected && { color: selectedLabelColor }]}
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
