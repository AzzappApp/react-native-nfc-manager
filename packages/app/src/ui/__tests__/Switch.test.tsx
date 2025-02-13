import { act, fireEvent, render } from '@testing-library/react-native';

import { colors } from '#theme';
import Switch from '../Switch';
const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

describe('Switch component', () => {
  const mockOnValueChange = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render Switch component with default value', () => {
    const { getByTestId } = render(
      <Switch testID="switch" onValueChange={mockOnValueChange} />,
    );

    const switchComponent = getByTestId('switch');
    expect(switchComponent.props.value).toBe(false);
  });

  test('should render Switch component with the right variant', () => {
    const { rerender, getByTestId } = render(
      <Switch
        testID="switch"
        variant="large"
        onValueChange={mockOnValueChange}
      />,
    );
    const switchComponent = getByTestId('switch');
    expect(switchComponent).toHaveStyle({
      transform: [{ scaleX: 49 / 51 }, { scaleY: 31 / 32 }],
    });

    rerender(
      <Switch
        testID="switch"
        variant="small"
        onValueChange={mockOnValueChange}
      />,
    );
    expect(switchComponent).toHaveStyle({
      transform: [{ scaleX: 0.67 }, { scaleY: 0.71 }],
    });
  });

  test('should render Switch component with dark mode', () => {
    mockedUseColorScheme.mockReturnValue('dark');
    const { getByTestId } = render(
      <Switch
        testID="switch"
        variant="large"
        onValueChange={mockOnValueChange}
      />,
    );

    const switchComponent = getByTestId('switch');
    expect(switchComponent.props.thumbTintColor).toBe(colors.grey200);
    expect(switchComponent.props.onTintColor).toBe(colors.grey100);
  });

  test('should call onValueChange when the user taps the switch', () => {
    const { getByTestId } = render(
      <Switch testID="switch" onValueChange={mockOnValueChange} />,
    );

    const switchComponent = getByTestId('switch');

    act(() => {
      fireEvent(switchComponent, 'onValueChange', true);
    });

    expect(mockOnValueChange).toHaveBeenCalledTimes(1);
    expect(mockOnValueChange).toHaveBeenCalledWith(true);
  });
});
