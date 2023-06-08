import type { PostRendererFeedProps } from '#components/PostRendererFeed';
import type { StyleProp, ViewStyle } from 'react-native';

export type PostLinkProps = PostRendererFeedProps & {
  postId: string;
  postRendererStyle?: StyleProp<ViewStyle>;
};
