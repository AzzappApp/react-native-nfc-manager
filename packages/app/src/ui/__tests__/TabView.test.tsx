import '@testing-library/jest-native/extend-expect';
import { createRef } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { act, render } from '#helpers/testHelpers';
import TabView from '../TabView';
import type { TabViewHandler } from '../TabView';

jest
  .spyOn(Dimensions, 'get')
  .mockReturnValue({ width: 400, height: 818, scale: 2, fontScale: 2 });

describe('TabView', () => {
  it('should navigate to tab', async () => {
    const ref = createRef<TabViewHandler>();
    const { getByTestId } = render(
      <TabView ref={ref} testID="tabViewId">
        <View testID="tab1" style={{ flex: 1 }}>
          <Text> Tab 1</Text>
        </View>
        <View testID="tab2" style={{ flex: 1 }}>
          <Text> Tab 2</Text>
        </View>
        <View testID="tab3" style={{ flex: 1 }}>
          <Text> Tab 3</Text>
        </View>
      </TabView>,
    );
    const tab = getByTestId('tabViewId');
    act(() => {
      ref.current?.navigateToTab(1); // Navigate to second tab
    });

    expect(tab).toHaveStyle({ transform: [{ translateX: -400 }] });
  });
});
