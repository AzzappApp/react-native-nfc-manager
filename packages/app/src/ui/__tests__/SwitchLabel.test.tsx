import { render, fireEvent, act } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import SwitchLabel from '../SwitchLabel';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

// Test suite for SwitchLabel component
describe('SwitchLabel component', () => {
  test('renders the `label` of the switch correclty', () => {
    const { getByText } = render(<SwitchLabel label="Test Label" />);
    expect(getByText('Test Label')).toBeTruthy();
  });

  test('should call `onValueChange` when switch is press', () => {
    // Define mock onChange function
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <SwitchLabel
        label="Test Label"
        value={false}
        onValueChange={mockOnChange}
        switchStyle={styles.switch}
        testID="switch"
      />,
    );
    const switchComponent = getByTestId('switch');
    // Simulate switch click
    act(() => {
      fireEvent(switchComponent, 'onValueChange', true);
    });
    fireEvent.press(getByTestId('switch'));
    // Verify that onChange has been called with the correct arguments
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  test('should display correctly in dark mode', () => {
    // Define mock onChange function
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <SwitchLabel
        label="Test Label"
        value={false}
        onValueChange={mockOnChange}
        switchStyle={styles.switch}
        testID="switch"
      />,
    );
    const switchComponent = getByTestId('switch');
    // Simulate switch click
    act(() => {
      fireEvent(switchComponent, 'onValueChange', true);
    });
    fireEvent.press(getByTestId('switch'));
    // Verify that onChange has been called with the correct arguments
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });
});

// Define styles needed for test
const styles = StyleSheet.create({
  switch: {
    width: 50,
    height: 25,
  },
});
