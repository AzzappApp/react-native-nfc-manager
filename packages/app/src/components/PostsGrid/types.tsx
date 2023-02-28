import type { PostsGrid_posts$data } from '@azzapp/relay/artifacts/PostsGrid_posts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type Post = ArrayItemType<PostsGrid_posts$data>;
export type ItemLayout = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type PostGridContainerProps = {
  children: ReactNode;
  contentHeight: number;
  stickyHeaderIndices?: number[];
  refreshing?: boolean;
  ListHeaderComponent?: ReactNode;
  ListFooterComponent?: ReactNode;
  style: StyleProp<ViewStyle>;
  postsContainerStyle: StyleProp<ViewStyle>;
  nestedScrollEnabled?: boolean;
  maxVideo?: number;
  onRefresh?: () => void;
  onWillScrollToTop?: () => void;
  onScroll?: (scrollPosition: number) => void;
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
  onScrollViewHeightChange?: (scrollViewHeight: number) => void;
  onHeaderHeightChange?: (headerHeight: number) => void;
};
