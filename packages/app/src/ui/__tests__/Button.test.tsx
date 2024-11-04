import { act, fireEvent, render, screen } from '@testing-library/react-native';
import Button from '../Button';
const label = 'label';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

describe('Button component', () => {
  jest.useFakeTimers();
  test('should render with the correct label', () => {
    render(<Button label={label} testID="button_testId" />);
    expect(screen.getByTestId('button_testId')).not.toBeNull();
    expect(screen.getByText(label)).not.toBeNull();
  });

  test('props `style` should apply correctly to the pressable component', () => {
    const style = { width: 200, height: 10 };
    render(<Button label={label} style={style} testID="button_testId" />);
    expect(screen.getByTestId('button_testId')).toHaveStyle(style);
  });

  test('props `style` should apply correctly to the pressable component with `variant` secondary', () => {
    const style = { width: 200, height: 10 };
    render(
      <Button
        label={label}
        style={style}
        variant="secondary"
        testID="button_testId"
      />,
    );
    expect(screen.getByTestId('button_testId')).toHaveStyle(style);
  });

  // TODO: reenable this test when `toHaveAnimatedStyle` is fixed
  xtest('props `style` backgroundColor should apply correctly to the pressable component', () => {
    const style = {
      width: 200,
      height: 10,
      backgroundColor: 'rgba(255, 0, 0, 1)',
    };
    render(
      <Button
        label={label}
        style={style}
        variant="primary"
        testID="button_testId"
      />,
    );

    expect(screen.getByTestId('button_testId')).toHaveAnimatedStyle(style);
  });

  test('props `style` backgroundColor should not apply when button is disabled', () => {
    const style = { width: 200, height: 10, backgroundColor: 'red' };
    render(
      <Button
        label={label}
        style={style}
        variant="secondary"
        disabled={true}
        testID="button_testId"
      />,
    );
    expect(screen.getByTestId('button_testId')).toHaveStyle([
      style,
      { backgroundColor: 'transparent' },
    ]);
  });

  // TODO: reenable this test when `toHaveAnimatedStyle` is fixed
  xtest('pressed style should apply correctly when the `button`is touch', () => {
    mockedUseColorScheme.mockReturnValue('light');
    render(
      <Button label={label} testOnly_pressed={true} testID="button_testId" />,
    );
    act(() => {
      fireEvent(screen.getByTestId('button_testId'), 'pressIn');
    });
    jest.advanceTimersByTime(2000);

    expect(screen.getByTestId('button_testId')).toHaveAnimatedStyle({
      backgroundColor: 'rgba(69, 68, 76, 1)', //colors.grey900,
    });
  });

  test('should call `onPress` callback when onPress is fired on the pressable component', () => {
    const onPress = jest.fn();
    render(<Button label={label} onPress={onPress} testID="button_testId" />);
    act(() => {
      fireEvent(screen.getByTestId('button_testId'), 'onPress');
    });
    expect(onPress).toHaveBeenCalled();
  });

  test('should not call `onPress` callback when props `disabled` is true', () => {
    const onPress = jest.fn();
    render(
      <Button
        label={label}
        onPress={onPress}
        disabled={true}
        testID="button_testId"
      />,
    );
    act(() => {
      fireEvent(screen.getByTestId('button_testId'), 'onPress');
    });
    expect(onPress).toHaveBeenCalledTimes(0);
  });

  // TODO: reenable this test when `toHaveAnimatedStyle` is fixed
  xtest('dark mode should apply correctly on each variant', () => {
    mockedUseColorScheme.mockReturnValue('dark');
    const { rerender } = render(
      <Button label={label} testID="button_testId" />,
    );

    expect(screen.getByTestId('button_testId')).toHaveAnimatedStyle({
      backgroundColor: 'rgba(255, 255, 255, 1)',
    });
    rerender(
      <Button label={label} testID="button_testId" variant="secondary" />,
    );

    expect(screen.getByTestId('button_testId')).toHaveAnimatedStyle({
      backgroundColor: 'transparent',
    });
  });

  test('should render with the correct label on android platform', () => {
    jest.mock('react-native/Libraries/Utilities/Platform', () => ({
      OS: 'android', // or 'ios'
      select: () => null,
    }));
    render(<Button label={label} testID="button_testId" />);
    expect(screen.getByTestId('button_testId')).not.toBeNull();
    expect(screen.getByText(label)).not.toBeNull();
  });
});
