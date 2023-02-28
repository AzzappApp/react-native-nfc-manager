import '@testing-library/jest-native/extend-expect';
import { fireEvent, render, screen } from '#utils/test-util';

import TagCategory from '../TagCategory';

describe('TagCategory component', () => {
  const mockSelect = jest.fn();
  beforeEach(() => {
    mockSelect.mockReset();
  });
  test('props `label` should apply correctly', () => {
    render(
      <TagCategory
        item={{ id: 'test', label: 'test' }}
        onPress={mockSelect}
        selected={false}
      />,
    );
    expect(screen.getByText('test')).toBeTruthy();
  });

  test('props `onSelect` should be call onPress with param', () => {
    render(
      <TagCategory
        item={{ id: 'test', label: 'test' }}
        onPress={mockSelect}
        selected={false}
      />,
    );
    fireEvent(
      screen.getByTestId('azzapp_TagCategory_pressable-wrapper'),
      'onPress',
    );
    expect(mockSelect).toHaveBeenCalledWith({ id: 'test', label: 'test' });
  });

  test('props `onSelect` should be call onPress with undefined if deselecting', () => {
    render(
      <TagCategory
        item={{ id: 'test', label: 'test' }}
        onPress={mockSelect}
        selected={false}
      />,
    );
    fireEvent(
      screen.getByTestId('azzapp_TagCategory_pressable-wrapper'),
      'onPress',
    );
    expect(mockSelect).toHaveBeenCalledWith({ id: 'test', label: 'test' });
  });
});
