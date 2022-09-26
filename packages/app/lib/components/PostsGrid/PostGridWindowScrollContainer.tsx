import throttle from 'lodash/throttle';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import type { PostGridContainerProps } from './types';
import type { LayoutChangeEvent } from 'react-native';

const PostGridWindowScrollContainer = ({
  children,
  contentHeight,
  ListHeaderComponent,
  ListFooterComponent,
  style,
  postsContainerStyle,
  onScroll,
  onScrollViewHeightChange,
  onHeaderHeightChange,
}: PostGridContainerProps) => {
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;
  useEffect(() => {
    const scrollListener = throttle(() => {
      onScrollRef.current?.(window.scrollY);
    }, 16);
    window.addEventListener('scroll', scrollListener);
    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, []);

  const onScrollViewHeightChangeRef = useRef(onScrollViewHeightChange);
  onScrollViewHeightChangeRef.current = onScrollViewHeightChange;

  useEffect(() => {
    onScrollViewHeightChangeRef.current?.(window.innerHeight);
    const resizeListener = throttle(() => {
      onScrollViewHeightChangeRef.current?.(window.innerHeight);
    }, 16);
    window.addEventListener('resize', resizeListener);
    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  }, []);

  const onHeaderLayout = (e: LayoutChangeEvent) => {
    onHeaderHeightChange?.(e.nativeEvent.layout.height);
  };

  return (
    <View style={style}>
      <View onLayout={onHeaderLayout}>{ListHeaderComponent}</View>
      <View style={[{ height: contentHeight }, postsContainerStyle]}>
        {children}
      </View>
      {ListFooterComponent}
    </View>
  );
};

export default PostGridWindowScrollContainer;
