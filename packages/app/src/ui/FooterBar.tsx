/**
 *
 * Common Implementation of the Bottom Menu and Footer from figma
 * https://www.figma.com/file/fmJgyUlpDU8G77GqH9H4rE/STYLE-GUIDE?node-id=704-125&t=xIPXRnOW3B8NjRW4-0
 * https://www.figma.com/file/fmJgyUlpDU8G77GqH9H4rE/STYLE-GUIDE?node-id=3-344&t=xIPXRnOW3B8NjRW4-0
 *
 * **/
import { StyleSheet, View } from 'react-native';
import { colors, fontFamilies } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Container from './Container';
import Icon from './Icon';
import PressableNative from './PressableNative';
import Text from './Text';
import type { Icons } from './Icon';
import type { StyleProp, ViewStyle } from 'react-native';

export type FooterBarItem = {
  /** unique tab key */
  key: string;

  /** the icon displayed on the tab, required if not topbar */
  icon: Icons;

  /** the label of the tab(use for accesibility also) */
  label: string;

  /**
   * by default tabs icons are tinted if this property is set to `'unactive'`
   * the icon will only be tinted when the tab is not selected
   * if this property is set to `false` the icon won't be tinted
   */
  tint?: 'unactive' | false | true;
};

export type FooterBarProps = {
  /**
   * the list of tabs to display
   */
  tabs: readonly FooterBarItem[];

  /**
   * the currently selected tab
   */
  currentTab?: string;
  /**
   * An event fired when the user press one of the tab
   */
  onItemPress?: (key: string) => void;
  /**
   * The size of icon used in the tabbar item
   */
  iconSize?: number;
  /*
   * the decoration of the tabbar under the icon. From the specification, there is no label and underline
   */
  decoration?: 'label' | 'none' | 'underline';
  /**
   * the Style of the container
   */
  style?: StyleProp<ViewStyle>;
  /*
   * the height of the tabbar
   */
  height?: number;
  /*
   * the tab item custom style
   */
  tabItemStyle?: StyleProp<ViewStyle>;
  /*
   * if true, the selected item with be surrounded by a circle woth color
   */
  showCircle?: boolean;
};

/**
 * A simple tabs bar component, this component is controlled
 * and does not hold any state.
 *
 * @param props
 */
const FooterBar = ({
  currentTab,
  tabs,
  onItemPress,
  iconSize = 28,
  decoration = 'none',
  style,
  height = 80,
  tabItemStyle,
  showCircle = false,
}: FooterBarProps) => {
  return (
    <Container
      style={[styles.container, { height }, style]}
      accessibilityRole="tablist"
    >
      {tabs.map(({ key, icon, tint, label }) => (
        <FooterBarItem
          key={key}
          icon={icon}
          label={label}
          tint={tint}
          isSelected={currentTab === key}
          onItemPress={onItemPress}
          iconSize={iconSize}
          decoration={decoration}
          tabKey={key} //key cannot be used in the children
          style={tabItemStyle}
          showCircle={showCircle}
        />
      ))}
    </Container>
  );
};

type FooterBarItemProps = FooterBarItem & {
  /**
   * An event fired when the user press one of the tab
   */
  onItemPress?: (key: string) => void;
  /**
   * item is selected
   */
  isSelected: boolean;
  /*
   * the decoration of the tabbar under the icon
   */
  decoration?: 'label' | 'none' | 'underline';
  /**
   * The size of icon used in the tabbar item
   */
  iconSize?: number;

  tabKey: string;
  /*
   * the tab item custom style
   */
  style?: StyleProp<ViewStyle>;
  /*
   * if true, the selected item with be surrounded by a circle woth color
   */
  showCircle?: boolean;
};

const FooterBarItem = ({
  icon,
  label,
  onItemPress,
  isSelected,
  tint,
  decoration,
  tabKey,
  style,
  showCircle,
  iconSize,
}: FooterBarItemProps) => {
  const appearanceStyles = useStyleSheet(computedStyles);

  const onPress = () => onItemPress?.(tabKey);

  const shouldNotTint = tint === false || (tint === 'unactive' && isSelected);

  return (
    <PressableNative
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[style ?? appearanceStyles.tab]}
    >
      <View
        style={[
          { backgroundColor: 'transparent' },
          showCircle && isSelected && appearanceStyles.selectedMenu,
          showCircle &&
            isSelected &&
            decoration === 'label' &&
            appearanceStyles.circleWithLabel,
        ]}
      >
        <Icon
          icon={icon}
          style={[
            appearanceStyles.image,
            { width: iconSize, height: iconSize },
            isSelected &&
              (showCircle
                ? appearanceStyles.imageActiveCircle
                : appearanceStyles.imageActive),
            shouldNotTint && { tintColor: undefined },
          ]}
        />
      </View>
      {decoration === 'label' && (
        <View style={[appearanceStyles.labelDecoration]}>
          <Text
            variant="xsmall"
            style={[
              appearanceStyles.label,
              isSelected && appearanceStyles.activeLabel,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
      {decoration === 'underline' && isSelected && (
        <View style={appearanceStyles.underline} />
      )}
    </PressableNative>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});

const computedStyles = createStyleSheet(appearance => ({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: appearance === 'light' ? colors.grey200 : colors.grey400,
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
    width: 34,
    height: 34,
    borderRadius: 17,
  },
}));
export default FooterBar;
