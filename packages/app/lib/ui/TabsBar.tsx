import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import Icon from './Icon';
import type { Icons } from './Icon';
import type { StyleProp, ViewStyle } from 'react-native';

type TabsBarProps = {
  currentTab: string;
  onTabPress: (tab: string) => void;
  tabs: ReadonlyArray<{
    key: string;
    icon: Icons;
    accessibilityLabel: string;
    tint?: boolean;
  }>;
  style?: StyleProp<ViewStyle>;
};

const TabsBar = ({ currentTab, tabs, onTabPress, style }: TabsBarProps) => (
  <View style={[styles.container, style]} accessibilityRole="tablist">
    {tabs.map(({ key, icon, tint, accessibilityLabel }) => (
      <Pressable
        key={key}
        style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
        accessibilityRole="tab"
        accessibilityLabel={accessibilityLabel}
        onPress={() => onTabPress(key)}
      >
        {({ pressed }) => (
          <Icon
            icon={icon}
            style={[
              styles.image,
              (pressed || currentTab === key) && styles.imageActive,
              tint === false && { tintColor: undefined },
            ]}
          />
        )}
      </Pressable>
    ))}
  </View>
);

export default TabsBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    borderRadius: 35,
  },
  tabPressed: {
    backgroundColor: colors.grey,
  },
  image: {
    width: 28,
    height: 28,
    tintColor: colors.grey,
  },
  imageActive: {
    tintColor: colors.dark,
  },
});
