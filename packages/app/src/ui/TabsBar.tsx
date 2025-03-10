import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import PressableNative from './PressableNative';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type Tab = {
  /** unique tab key */
  tabKey: string;
  /** the accessibility lable of the tab */
  label: string;
  /**
   * and node elment to display on the right of the label
   *
   * @type {ReactNode}
   */
  rightElement?: ReactNode;
};

export type TabsBarProps = {
  /**
   * the list of tabs to display
   */
  tabs: readonly Tab[];

  /**
   * the currently selected tab index
   */
  currentTab: string;

  /**
   * An event fired when the user press one of the tab
   */
  onTabPress?: (tab: string) => void;

  /**
   * the Style of the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * the decoration of the tabbar under the icon
   */
  decoration?: 'none' | 'underline';
};

export const TAB_BAR_HEIGHT = 30;

/**
 * A simple tabs bar component, this component is controlled
 * and does not hold any state.
 *
 * @param props
 */
const TabsBar = ({
  currentTab,
  decoration = 'none',
  tabs,
  onTabPress,
  style,
}: TabsBarProps) => {
  const styles = useStyleSheet(styleSheet);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        style,
        {
          minWidth: '100%',
        },
      ]}
      accessibilityRole="tablist"
      testID="tablist"
      bounces={false}
    >
      {tabs.map(({ tabKey, rightElement, label }) => (
        <TabsBarItem
          key={tabKey}
          onTabPress={onTabPress}
          tabKey={tabKey}
          isSelected={tabKey === currentTab}
          decoration={decoration}
          label={label}
          rightElement={rightElement}
        />
      ))}
      <View style={styles.backgroundLine} />
    </ScrollView>
  );
};

type TabsBarItemProps = Tab & {
  /**
   * An event fired when the user press one of the tab
   */
  onTabPress?: (tab: string) => void;
  /**
   * item is selected
   */
  isSelected: boolean;
  /*
   * the decoration of the tabbar under the icon
   */
  decoration?: 'none' | 'underline';
  /**
   * The size of icon used in the tabbar item
   */
};

const TabsBarItem = ({
  label,
  tabKey,
  onTabPress,
  isSelected,
  decoration,
  rightElement,
}: TabsBarItemProps) => {
  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(() => {
    if (onTabPress) onTabPress(tabKey);
  }, [tabKey, onTabPress]);

  return (
    <>
      <View style={styles.backgroundLine} />
      <PressableNative
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: isSelected }}
        onPress={onPress}
        style={styles.tab}
      >
        <View style={styles.labelContainer}>
          <Text variant="smallbold">{label}</Text>
          {rightElement}
        </View>
        <View
          style={[
            styles.underline,
            isSelected && decoration === 'underline' && styles.selected,
          ]}
        />
      </PressableNative>
    </>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    justifyContent: 'space-around',
  },
  backgroundLine: {
    flex: 1,
    height: 1,
    minWidth: 5,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    alignSelf: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  selected: {
    borderBottomWidth: 2,
    borderColor: appearance === 'light' ? colors.black : colors.white,
  },
  underline: { bottom: 0, width: '100%', height: '100%', position: 'absolute' },
}));

export default TabsBar;
