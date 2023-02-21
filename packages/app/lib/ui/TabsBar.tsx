import { Fragment } from 'react';
import { Text, View } from 'react-native';
import { colors, fontFamilies } from '../../theme';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '../helpers/createStyles';
import Icon from './Icon';
import PressableBackground from './PressableBackground';
import type { Icons } from './Icon';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type Tab = {
  /** unique tab key */
  key: string;

  /** the icon displayed on the tab, required if not topbar */
  icon?: Icons;

  /** the accessibility lable of the tab */
  label: string;

  rightElement?: ReactNode;

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
   *  - tabbar: the tabbar is displayed at the bottom of the screen
   *  - toolbar: the tabbar is displayed at the bottom of the screen
   *  - topbar: the tabbar is displayed at the top of the screen,
   *    in this variant the label is displayed instead of the icon
   */
  variant?: 'tabbar' | 'toolbar' | 'topbar';

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
      {tabs.map(({ key, icon, tint, rightElement, label }, index) => (
        <Fragment key={key}>
          {variant === 'topbar' && <View style={styles.backgroundLine} />}
          <PressableBackground
            key={key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: currentTab === key }}
            onPress={() => onTabPress(key)}
            style={[
              styles.tab,
              index === tabs.length - 1 && styles.lastTab,
              currentTab === key && styles.selectedTab,
            ]}
            highlightColor={colors.grey100}
          >
            {({ pressed }) => {
              const active = pressed || currentTab === key;
              const shouldNotTint =
                tint === false || (tint === 'unactive' && active);
              return (
                <>
                  {variant === 'topbar' ? (
                    <View style={styles.labelContainer}>
                      <Text style={styles.label}>{label}</Text>
                      {rightElement}
                    </View>
                  ) : (
                    <Icon
                      icon={icon!}
                      style={[
                        styles.image,
                        active && styles.imageActive,
                        shouldNotTint && { tintColor: undefined },
                      ]}
                    />
                  )}
                  {(variant === 'tabbar' || variant === 'topbar') && (
                    <View
                      style={[
                        styles.highlightUnderline,
                        {
                          backgroundColor:
                            currentTab === key ? colors.red : 'transparent',
                        },
                      ]}
                    />
                  )}
                </>
              );
            }}
          </PressableBackground>
        </Fragment>
      ))}
      {variant === 'topbar' && <View style={styles.backgroundLine} />}
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
      marginRight: 10,
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
    highlightUnderline: {
      width: 14,
      height: 4,
      borderRadius: 4,
      marginTop: 10,
      backgroundColor: 'transparent',
    },
  },
  topbar: {
    container: {
      height: 26,
      backgroundColor: 'transparent',
    },
    backgroundLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.grey50,
      alignSelf: 'center',
    },
    tab: {
      backgroundColor: 'transparent',
      marginHorizontal: 10,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
    },
    label: {
      ...fontFamilies.semiBold,
      color: colors.black,
      fontSize: 12,
    },
    highlightUnderline: {
      position: 'absolute',
      top: 24,
      left: 0,
      width: '100%',
      height: 2,
      backgroundColor: 'transparent',
    },
  },
}));
export default TabsBar;
