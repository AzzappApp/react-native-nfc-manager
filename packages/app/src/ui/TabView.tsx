import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';
import type { ViewProps } from 'react-native';

export type TabViewProps = Omit<ViewProps, 'children'> & {
  currentTab: string;
  tabs: Array<{ id: string; element: ReactElement }>;
  mountOnlyCurrentTab?: boolean;
};

const TabView = ({
  tabs,
  currentTab,
  style,
  mountOnlyCurrentTab,
  ...props
}: TabViewProps) => (
  <View {...props} style={[{ overflow: 'hidden' }, style]}>
    {tabs.map(({ id, element }) =>
      mountOnlyCurrentTab && id !== currentTab ? null : (
        <View
          key={id}
          style={[
            StyleSheet.absoluteFill,
            id !== currentTab && { opacity: 0, zIndex: -1 },
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: id === currentTab }}
          aria-hidden={id !== currentTab}
          pointerEvents={id === currentTab ? 'auto' : 'none'}
        >
          {element}
        </View>
      ),
    )}
  </View>
);

export default TabView;
