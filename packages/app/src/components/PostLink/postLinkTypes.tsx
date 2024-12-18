import type { PostRendererFeedProps } from '#components/PostList/PostRendererFeed';
import type { StyleProp, ViewStyle } from 'react-native';

export type PostLinkProps = PostRendererFeedProps & {
  onLike: () => void;
  postId: string;
  postRendererStyle?: StyleProp<ViewStyle>;
};
