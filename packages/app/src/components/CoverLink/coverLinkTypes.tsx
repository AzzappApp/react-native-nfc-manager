import type { CoverRendererProps } from '#components/CoverRenderer';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

export type CoverLinkRendererProps = CoverRendererProps & {
  /**
   * The username of the webCard, used to navigate to the profile
   */
  userName: string;
  /**
   * The webCard ID of the user, used to animate the cover when opening the profile
   * on iOS
   */
  webCardId: string;
  /**
   * style of the wrapped CoverRenderer
   */
  coverStyle?: StyleProp<ViewStyle>;
  /**
   * should the webcard be prefetched
   * @default false
   */
  prefetch?: boolean;
  /**
   * onPress callback, can be used to prevent the default navigation
   */
  onPress?: (e: GestureResponderEvent) => void;
  /**
   * onLongPress callback
   */
  onLongPress?: (e: GestureResponderEvent) => void;

  disabled?: boolean;
};
