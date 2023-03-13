import type { PostRendererProps } from '#components/PostRenderer';
import type { StyleProp, ViewStyle } from 'react-native';

export type PostLinkProps = PostRendererProps & {
  postId: string;
  postRendererStyle?: StyleProp<ViewStyle>;
};
