import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useImperativeHandle,
  useState,
} from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ForwardedRef } from 'react';
import type { ViewProps } from 'react-native';

export type TabViewHandler = {
  navigateToTab: (index: number) => void;
};

const TabView = (
  { children, style, ...props }: ViewProps,
  forwardedRef: ForwardedRef<TabViewHandler>,
) => {
  const [translateX, setTranslateX] = useState(0);
  const { width } = useWindowDimensions();
  const childrenArray = Children.toArray(children);
  useImperativeHandle(
    forwardedRef,
    () => ({
      async navigateToTab(index) {
        setTranslateX(index * width);
      },
    }),
    [width],
  );
  return (
    <View
      style={[
        styles.bottomPanelContainer,
        {
          transform: [{ translateX: -translateX }],
          width: childrenArray.length * width,
        },
        style,
      ]}
      {...props}
    >
      {childrenArray.map(child =>
        isValidElement(child) ? cloneElement(child) : child,
      )}
    </View>
  );
};
export default forwardRef(TabView);

const styles = StyleSheet.create({
  containerStyle: { flex: 1 },
  bottomPanelContainer: {
    flex: 1,
    flexDirection: 'row',
  },
});
