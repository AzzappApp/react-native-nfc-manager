import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import Icon from './Icon';
import type { Icons } from './Icon';
import type { StyleProp, ViewStyle } from 'react-native';

type TabsBarProps = {
  /**
   * the list of tabs to display
   */
  tabs: ReadonlyArray<{
    /** unique tab key */
    key: string;

    /** the icon displayed on the tab */
    icon: Icons;

    /** the accessibility lable of the tab */
    accessibilityLabel: string;

    /**
     * by default tabs icons are tinted if this property is set to `'unactive'`
     * the icon will only be tinted when the tab is not selected
     * if this property is set to `false` the icon won't be tinted
     */
    tint?: 'unactive' | false | true;
  }>;

  /**
   * the currently selected tab
   */
  currentTab?: string;

  /**
   * An event fired when the user press one of the tab
   */
  onTabPress: (tab: string) => void;

  style?: StyleProp<ViewStyle>;
};

export const TAB_BAR_HEIGHT = 70;

/**
 * A simple tabs bar component, this component is controlled
 * and does not hold any state.
 *
 * @param props
 */
const TabsBar = ({ currentTab, tabs, onTabPress, style }: TabsBarProps) => (
  <View style={[styles.container, style]} accessibilityRole="tablist">
    {tabs.map(({ key, icon, tint, accessibilityLabel }) => (
      <Pressable
        key={key}
        style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
        accessibilityRole="tab"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: currentTab === key }}
        onPress={() => onTabPress(key)}
      >
        {({ pressed }) => {
          const active = pressed || currentTab === key;
          const shouldNotTint =
            tint === false || (tint === 'unactive' && active);
          return (
            <>
              <Icon
                icon={icon}
                style={[
                  styles.image,
                  active && styles.imageActive,
                  shouldNotTint && { tintColor: undefined },
                ]}
              />
              <View
                style={{
                  width: 14,
                  height: 4,
                  borderRadius: 4,
                  marginTop: 10,
                  backgroundColor:
                    currentTab === key ? colors.red : 'transparent',
                }}
              />
            </>
          );
        }}
      </Pressable>
    ))}
  </View>
);

export default TabsBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  tabPressed: {
    backgroundColor: colors.lightGrey,
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
