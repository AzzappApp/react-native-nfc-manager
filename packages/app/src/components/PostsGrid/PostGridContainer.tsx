import { useRef } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import useScrollToTopInterceptor from '#hooks/useScrollToTopInterceptor/useScrollToTopInterceptor';
import type { PostGridContainerProps } from './types';
import type { LayoutChangeEvent } from 'react-native';

const PostGridContainer = ({
  children,
  contentHeight,
  nestedScrollEnabled = false,
  stickyHeaderIndices,
  refreshing,
  ListHeaderComponent,
  ListFooterComponent,
  style,
  postsContainerStyle,
  onRefresh,
  onScroll,
  onScrollStart,
  onScrollEnd,
  onScrollViewHeightChange,
  onHeaderHeightChange,
  onWillScrollToTop,
}: PostGridContainerProps) => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollToTopInterceptor = useScrollToTopInterceptor(() => {
    if (scrollViewRef.current) {
      onWillScrollToTop?.();
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  });

  const onLayout = (e: LayoutChangeEvent) => {
    onScrollViewHeightChange?.(e.nativeEvent.layout.height);
  };

  const onHeaderLayout = (e: LayoutChangeEvent) => {
    onHeaderHeightChange?.(e.nativeEvent.layout.height);
  };

  return (
    <ScrollView
      accessibilityRole="list"
      testID="post-grid-container"
      nestedScrollEnabled={nestedScrollEnabled}
      ref={ref => {
        scrollToTopInterceptor(ref);
        scrollViewRef.current = ref;
      }}
      style={style}
      stickyHeaderIndices={stickyHeaderIndices}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing ?? false}
          onRefresh={onRefresh}
        />
      }
      scrollEventThrottle={16}
      onScroll={e => onScroll?.(e.nativeEvent.contentOffset.y)}
      onScrollBeginDrag={onScrollStart}
      onMomentumScrollEnd={onScrollEnd}
      onLayout={onLayout}
    >
      {ListHeaderComponent && (
        <View onLayout={onHeaderLayout}>{ListHeaderComponent}</View>
      )}
      <View
        style={[{ height: contentHeight, width: '100%' }, postsContainerStyle]}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF' }]} />
        {children}
      </View>
      {ListFooterComponent}
    </ScrollView>
  );
};

export default PostGridContainer;
