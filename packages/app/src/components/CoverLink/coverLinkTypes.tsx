import type { CoverRendererProps } from '#components/CoverRenderer';
import type { StyleProp, ViewStyle } from 'react-native';

export type CoverLinkProps = CoverRendererProps & {
  /**
   * The profile ID of the user, used to animate the cover when opening the profile
   * on iOS
   */
  profileID: string;
  /**
   * style of the wrapped CoverRenderer
   */
  coverStyle?: StyleProp<ViewStyle>;
};
