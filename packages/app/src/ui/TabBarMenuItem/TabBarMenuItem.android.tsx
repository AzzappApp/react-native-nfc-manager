import { StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import Icon from '../Icon';
import PressableNative from '../PressableNative';
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
  style,
}: TabBarMenuItemProps) => {
  return (
    <View style={[styles.container, style]}>
      <PressableNative
        style={[
          styles.pressable,
          {
            backgroundColor: selected
              ? selectedBackgroundColor
              : backgroundColor,
          },
        ]}
        onPress={onPress}
        accessibilityRole="tab"
        android_ripple={{ color: selectedBackgroundColor, borderless: false }}
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
      </PressableNative>
    </View>
  );
};
export const TAB_BAR_MENU_ITEM_HEIGHT = 32;

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
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
