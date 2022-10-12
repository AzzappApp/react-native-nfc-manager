import { View } from 'react-native';
import { colors } from '../../theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '../helpers/createStyles';
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
  variant?: 'tabbar' | 'toolbar';

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
  variant = 'tabbar',
  style,
}: TabsBarProps) => {
  const styles = useVariantStyleSheet(computedStyles, variant);

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
          highlightColor={styles.highlight.backgroundColor}
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
                {variant === 'tabbar' && (
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

const computedStyles = createVariantsStyleSheet(appearance => ({
  default: {
    container: {
      flexDirection: 'row',
      height: TAB_BAR_HEIGHT,
      justifyContent: 'space-around',
      backgroundColor: appearance === 'light' ? '#FFF' : '#111',
    },
    tab: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: appearance === 'light' ? '#FFF' : '#111',
    },
    image: {
      tintColor: appearance === 'light' ? colors.grey : colors.darkGrey,
    },
    imageActive: {
      tintColor: appearance === 'light' ? colors.dark : '#FFF',
    },
  },
  tabbar: {
    highlight: {
      backgroundColor: appearance === 'light' ? colors.grey100 : 'blue',
    },
    image: {
      width: 28,
      height: 28,
      tintColor: colors.grey,
    },
    imageActive: {
      tintColor: appearance === 'light' ? colors.dark : '#FFF',
    },
  },
  toolbar: {
    container: {
      padding: 10,
      borderRadius: TAB_BAR_HEIGHT / 2,
      shadowColor: colors.black,
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
    },
    tab: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 25,
    },
    lastTab: { marginRight: 0 },
    selectedTab: {
      backgroundColor: colors.black,
    },
    highlight: {
      backgroundColor: colors.black,
    },
    image: {
      height: 18,
      tintColor: colors.grey200,
    },
    imageActive: {
      tintColor: '#fff',
    },
  },
}));
export default TabsBar;
