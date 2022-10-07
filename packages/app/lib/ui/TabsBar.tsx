import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import Icon from './Icon';
import PressableBackground from './PressableBackground';
import type { Icons } from './Icon';
import type { StyleProp, ViewStyle } from 'react-native';

export type Tab = {
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
};

export type TabsBarProps = {
  /**
   * the list of tabs to display
   */
  tabs: readonly Tab[];

  /**
   * the currently selected tab
   */
  currentTab?: string;

  /**
   * Style variants
   */
  variant?: 'default' | 'tool';

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
const TabsBar = ({
  currentTab,
  tabs,
  onTabPress,
  variant = 'default',
  style,
}: TabsBarProps) => {
  const styles = variantStyles[variant];
  return (
    <View style={[styles.container, style]} accessibilityRole="tablist">
      {tabs.map(({ key, icon, tint, accessibilityLabel }, index) => (
        <PressableBackground
          key={key}
          accessibilityRole="tab"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ selected: currentTab === key }}
          onPress={() => onTabPress(key)}
          style={[
            styles.tab,
            index === tabs.length - 1 && styles.lastTab,
            currentTab === key && styles.selectedTab,
          ]}
          highlightColor={variant === 'default' ? colors.grey100 : colors.black}
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
                {variant === 'default' && (
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
                )}
              </>
            );
          }}
        </PressableBackground>
      ))}
    </View>
  );
};

export default TabsBar;

const variantStyles = {
  default: StyleSheet.create({
    container: {
      flexDirection: 'row',
      height: TAB_BAR_HEIGHT,
      justifyContent: 'space-around',
    },
    tab: {
      alignItems: 'center',
      justifyContent: 'center',
      width: TAB_BAR_HEIGHT,
      backgroundColor: 'white',
    },
    lastTab: {},
    selectedTab: {},
    image: {
      width: 28,
      height: 28,
      tintColor: colors.grey,
    },
    imageActive: {
      tintColor: colors.dark,
    },
  }),
  tool: StyleSheet.create({
    container: {
      flexDirection: 'row',
      height: TAB_BAR_HEIGHT,
      justifyContent: 'space-around',
      padding: 10,
      borderRadius: TAB_BAR_HEIGHT / 2,
      backgroundColor: 'white',
      shadowColor: colors.black,
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
    },
    tab: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 25,
      backgroundColor: 'white',
    },
    lastTab: { marginRight: 0 },
    selectedTab: {
      backgroundColor: colors.black,
    },
    image: {
      height: 18,
      tintColor: colors.grey200,
    },
    imageActive: {
      tintColor: '#fff',
    },
  }),
};
