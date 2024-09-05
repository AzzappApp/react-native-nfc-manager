import type { Icons } from '../Icon';
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
  onPress: () => void;
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
  style?: StyleProp<ViewStyle>;
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

  /**
   * Whether the item is disabled
   * @type {boolean}
   */
  disabled?: boolean;
}>;

export default TabBarMenuItemProps;
