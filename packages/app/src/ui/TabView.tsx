import { useMemo, type ReactElement, useEffect, useRef } from 'react';
import { View, type ViewProps } from 'react-native';
import PagerView from 'react-native-pager-view';

export type TabViewProps = Omit<ViewProps, 'children'> & {
  currentTab: string;
  tabs: Array<{ id: string; element: ReactElement }>;
};

const TabView = ({ tabs, currentTab, ...props }: TabViewProps) => {
  const initialPage = useMemo(
    () => tabs.findIndex(({ id }) => id === currentTab),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const tabRef = useRef<PagerView>(null);
  const lastPage = useRef<number>(initialPage);
  useEffect(() => {
    const nextPage = tabs.findIndex(({ id }) => id === currentTab);
    if (nextPage !== lastPage.current) {
      tabRef.current?.setPageWithoutAnimation(nextPage);
      lastPage.current = nextPage;
    }
  }, [currentTab, initialPage, tabs]);

  return (
    <PagerView
      ref={tabRef}
      scrollEnabled={false}
      {...props}
      initialPage={initialPage}
    >
      {tabs.map(({ id, element }) => (
        <View key={id} style={{ flex: 1 }} collapsable={false}>
          {element}
        </View>
      ))}
    </PagerView>
  );
};
export default TabView;
