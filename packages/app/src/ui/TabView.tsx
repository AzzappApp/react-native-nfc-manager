import { Screen, ScreenContainer } from 'react-native-screens';
import type { ReactElement } from 'react';
import type { ViewProps } from 'react-native';

export type TabViewProps = Omit<ViewProps, 'children'> & {
  currentTab: string;
  tabs: Array<{ id: string; element: ReactElement }>;
};

const TabView = ({ tabs, currentTab, ...props }: TabViewProps) => {
  return (
    <ScreenContainer hasTwoStates {...props}>
      {tabs.map(({ id, element }) => (
        <Screen
          key={id}
          activityState={currentTab === id ? 2 : 0}
          gestureEnabled={false}
        >
          {element}
        </Screen>
      ))}
    </ScreenContainer>
  );
};
export default TabView;
