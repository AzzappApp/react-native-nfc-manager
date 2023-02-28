import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import type { ForwardedRef } from 'react';
import type { ViewProps } from 'react-native';

export type PagerViewHandle = {
  setPage: (page: number) => void;
};

const PagerView = (
  { children, scrollEnabled = true }: PagerViewProps,
  ref: ForwardedRef<PagerViewHandle>,
) => {
  const scrollViewRef = useRef<ScrollView>(null);
  useImperativeHandle(
    ref,
    () => {
      return {
        setPage: (page: number) => {
          scrollViewRef.current?.scrollTo({
            x: page * window.innerWidth,
            animated: true,
          });
        },
      };
    },
    [],
  );
  const childs = useMemo(() => React.Children.toArray(children), [children]);

  return (
    <ScrollView
      ref={scrollViewRef}
      scrollEnabled={scrollEnabled}
      contentContainerStyle={{ flex: 1 }}
      horizontal
      nestedScrollEnabled={true}
    >
      {childs.map((child, index) => (
        <View
          key={index}
          style={{
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          pointerEvents="box-none"
        >
          <View
            pointerEvents="box-none"
            style={{ height: '100%', maxWidth: 640 }}
          >
            {child}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default forwardRef(PagerView);

export type PagerViewProps = ViewProps & {
  scrollEnabled?: boolean;
  initialPage: number;
};
