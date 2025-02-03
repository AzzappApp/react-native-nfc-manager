/**
 *
 * Common Implementation of the Bottom Menu and Footer from figma
 * https://www.figma.com/file/fmJgyUlpDU8G77GqH9H4rE/STYLE-GUIDE?node-id=704-125&t=xIPXRnOW3B8NjRW4-0
 * https://www.figma.com/file/fmJgyUlpDU8G77GqH9H4rE/STYLE-GUIDE?node-id=3-344&t=xIPXRnOW3B8NjRW4-0
 *
 * **/
import React, { cloneElement, useCallback } from 'react';
import { Platform, View } from 'react-native';
import { shadow, colors, fontFamilies } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Container from './Container';
import Icon from './Icon';
import PressableNative from './PressableNative';
import Text from './Text';
import type { Icons } from './Icon';
import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

export type BottomMenuItem = {
  /** unique tab key */
  key: string;
  /** the icon displayed on the tab */
  icon?: Icons;
  /**
   * the icon component displayed on the tab
   *
   * @type {React.ReactNode}
   */
  IconComponent?: React.ReactElement;
  /** the label of the tab(use for accesibility also) */
  label: ReactNode;
  /**
   * by default tabs icons are tinted if this property is set to `'unactive'`
   * the icon will only be tinted when the tab is not selected
   * if this property is set to `false` the icon won't be tinted
   */
  tint?: 'unactive' | false | true;
};

export type BottomMenuProps = Omit<ViewProps, 'children'> & {
  /**
   * the list of tabs to display
   */
  tabs: readonly BottomMenuItem[];
  /**
   * The size of icon used in the tabbar item
   */
  iconSize?: number;
  /**
   * the currently selected tab
   */
  currentTab?: string;
  /**
   * An event fired when the user press one of the tab
   */
  onItemPress?: (key: string) => void;
  /*
   * the decoration of the tabbar under the icon. From the specification, there is no label and underline
   */
  showLabel?: boolean;
  /*
   * if true, the selected item with be surrounded by a circle woth color
   */
  showCircle?: boolean;
  /**
   * the Style of the container
   */
  style?: StyleProp<ViewStyle>;
};

export const BOTTOM_MENU_HEIGHT = 70;

/**
 * A simple tabs bar component, this component is controlled
 * and does not hold any state.
 *
 * @param props
 */
const BottomMenu = ({
  tabs,
  currentTab,
  iconSize = 28,
  onItemPress,
  showLabel = false,
  showCircle = true,
  style,
  ...props
}: BottomMenuProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View style={styles.bottomMenuContainer} {...props}>
      <Container
        accessibilityRole="tablist"
        accessible
        style={[style, styles.container]}
      >
        {tabs.map(({ key, icon, IconComponent, tint, label }, index) => (
          <BottomMenuItemRenderer
            key={key}
            tabKey={key} //key cannot be used in the children
            icon={icon}
            IconComponent={IconComponent}
            label={label}
            tint={tint}
            iconSize={iconSize}
            isSelected={currentTab === key}
            onItemPress={onItemPress}
            showLabel={showLabel}
            showCircle={showCircle}
            isFirst={index === 0}
            isLast={index === tabs.length - 1}
          />
        ))}
      </Container>
    </View>
  );
};

export default BottomMenu;

type BottomMenuItemRendererProps = BottomMenuItem & {
  /**
   * An event fired when the user press one of the tab
   */
  onItemPress?: (key: string) => void;
  /**
   * item is selected
   */
  isSelected: boolean;
  /**
   * The size of icon used in the tabbar item
   */
  iconSize: number;
  /*
   * the decoration of the tabbar under the icon
   */
  showLabel?: boolean;

  tabKey: string;
  /*
   * if true, the selected item with be surrounded by a circle with color
   */
  showCircle?: boolean;
  /**
   * if true, the tab is the last one
   */
  isFirst?: boolean;
  /**
   * if true, the tab is the last one
   */
  isLast?: boolean;
};

const BottomMenuItemRenderer = ({
  tabKey,
  icon,
  IconComponent,
  iconSize,
  label,
  showLabel,
  onItemPress,
  isSelected,
  tint,
  showCircle,
  isFirst,
  isLast,
}: BottomMenuItemRendererProps) => {
  if ((!icon && !IconComponent) || (icon && IconComponent)) {
    throw new Error('You must provide an icon or an IconComponent');
  }
  const styles = useStyleSheet(styleSheet);

  const onPress = useCallback(
    () => onItemPress?.(tabKey),
    [onItemPress, tabKey],
  );

  const shouldNotTint = tint === false || (tint === 'unactive' && isSelected);

  return (
    <View
      style={[
        styles.tabContainer,
        isFirst && styles.firstTabContainer,
        isLast && styles.lastTabContainer,
      ]}
    >
      <PressableNative
        testID={tabKey}
        accessibilityRole="tab"
        accessibilityLabel={typeof label === 'string' ? label : undefined}
        accessibilityState={{ selected: isSelected }}
        onPress={onPress}
        style={[
          styles.tab,
          isFirst && styles.fistTab,
          isLast && styles.lastTab,
        ]}
      >
        <View
          style={[
            { backgroundColor: 'transparent' },
            showCircle && isSelected && styles.selectedMenu,
            showCircle && showLabel && styles.circleWithLabel,
          ]}
        >
          {icon && (
            <Icon
              icon={icon}
              style={[
                styles.image,
                { width: iconSize, height: iconSize },
                isSelected &&
                  (showCircle ? styles.imageActiveCircle : styles.imageActive),
                shouldNotTint && { tintColor: undefined },
              ]}
            />
          )}
          {IconComponent &&
            cloneElement(IconComponent, {
              style: [
                styles.image,
                { width: iconSize, height: iconSize },
                isSelected &&
                  (showCircle ? styles.imageActiveCircle : styles.imageActive),
                shouldNotTint && { tintColor: undefined },
                IconComponent.props.style,
              ],
            })}
        </View>
        {showLabel && (
          <View style={styles.labelDecoration}>
            <Text
              variant="xsmall"
              style={[styles.label, isSelected && styles.activeLabel]}
            >
              {label}
            </Text>
          </View>
        )}
      </PressableNative>
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  bottomMenuContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Platform.select({ android: 10, default: 0 }),
  },
  container: [
    {
      height: BOTTOM_MENU_HEIGHT,
      borderRadius: BOTTOM_MENU_HEIGHT / 2,
      flexDirection: 'row',
      backgroundColor: appearance === 'light' ? colors.white : colors.grey1000,
    },
    shadow(appearance),
  ],
  tabContainer: {
    flex: 1,
    overflow: 'hidden',
    minWidth: 50,
    borderColor: 'transparent',
    borderRadius: 20,
  },
  firstTabContainer: [
    // :warning: this is a workaround for the ios that cause the strange #5735 issue
    Platform.select({
      android: {
        borderTopStartRadius: BOTTOM_MENU_HEIGHT / 2,
        borderBottomStartRadius: BOTTOM_MENU_HEIGHT / 2,
      },
      default: {},
    }),
    { minWidth: 60 },
  ],
  lastTabContainer: [
    // :warning: this is a workaround for the ios that cause the strange #5735 issue
    Platform.select({
      android: {
        borderTopEndRadius: BOTTOM_MENU_HEIGHT / 2,
        borderBottomEndRadius: BOTTOM_MENU_HEIGHT / 2,
      },
      default: {},
    }),
    { minWidth: 60 },
  ],
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fistTab: {
    paddingLeft: 10,
  },
  lastTab: {
    paddingRight: 10,
  },
  labelDecoration: {
    marginTop: 5,
    backgroundColor: 'transparent',
  },
  activeLabel: {
    color: appearance === 'light' ? colors.black : colors.white,
  },
  label: {
    ...fontFamilies.semibold,
    lineHeight: 14,
    fontSize: 11,
    color: appearance === 'light' ? colors.grey300 : colors.grey500,
  },
  image: {
    tintColor: appearance === 'light' ? colors.grey200 : colors.grey400,
  },
  imageActive: {
    tintColor: appearance === 'light' ? colors.black : colors.white,
  },
  imageActiveCircle: {
    tintColor: appearance === 'light' ? colors.white : colors.black,
  },
  underline: {
    width: 14,
    height: 4,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    borderRadius: 4,
    marginTop: 5,
  },
  selectedMenu: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    width: 50,
    height: 50,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  circleWithLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 17,
  },
}));
