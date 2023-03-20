import { View } from 'react-native';
import { act, fireEvent, render } from '#helpers/testHelpers';
import '@testing-library/jest-native/extend-expect';

import DropDownList from '../DropDownList';

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
const FAKE_DATA = (num: number) =>
  [...Array(num)].map((_, i) => {
    return {
      id: `${i}`,
      label: `item ${i}`,
    };
  });

const setSelected = jest.fn();

describe('DropDownList ui component', () => {
  beforeEach(() => {
    setSelected.mockReset();
  });

  test('should apply `textInputProps` props correctly', () => {
    const { getByPlaceholderText } = render(
      <DropDownList
        textInputProps={{
          placeholder: 'placeholdertest',
          accessibilityLabel: 'AccessibilityLabel',
        }}
        label="Activity"
        setSelected={setSelected}
        data={FAKE_DATA(10)}
      />,
    );

    expect(getByPlaceholderText('placeholdertest')).toBeTruthy();
  });

  test('should show the list on touching the view container', () => {
    const { getByRole, getByTestId } = render(
      <DropDownList
        textInputProps={{
          placeholder: 'placeholdertest',
          accessibilityLabel: 'AccessibilityLabel',
          testID: 'testId',
        }}
        label="Activity"
        setSelected={setSelected}
        data={FAKE_DATA(10)}
      />,
    );

    expect(getByTestId('azzapp__dropdownlist__animated-view')).toHaveStyle({
      opacity: 0,
    });
    act(() => {
      fireEvent(
        getByTestId('azzapp__dropdownlist__touchable-container'),
        'onTouchStart',
      );
    });
    expect(getByRole('list')).toBeTruthy();
  });

  test('`containerStyle` props should correctly be applied to the view', () => {
    const { UNSAFE_getByType } = render(
      <DropDownList
        textInputProps={{
          placeholder: 'placeholdertest',
          accessibilityLabel: 'AccessibilityLabel',
          testID: 'testId',
        }}
        label="Activity"
        setSelected={setSelected}
        data={FAKE_DATA(10)}
        containerStyle={{ backgroundColor: 'red' }}
      />,
    );

    expect(UNSAFE_getByType(View)).toHaveStyle({ backgroundColor: 'red' });
  });

  test('should call `setSelected`props when selecting an item', () => {
    const { getAllByRole, getByTestId } = render(
      <DropDownList
        textInputProps={{
          placeholder: 'placeholdertest',
          accessibilityLabel: 'AccessibilityLabel',
        }}
        maxHeight={100}
        label="Activity"
        setSelected={setSelected}
        data={FAKE_DATA(100)}
      />,
    );
    act(() => {
      fireEvent(
        getByTestId('azzapp__dropdownlist__touchable-container'),
        'onTouchStart',
      );
    });

    act(() => fireEvent.press(getAllByRole('button')[4]));
    expect(setSelected).toHaveBeenCalled();
  });
});
