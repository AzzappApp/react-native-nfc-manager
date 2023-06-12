import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { colors } from '#theme';
import Button from '../Button';
const label = 'label';

const mockedUseColorScheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => {
  return {
    default: mockedUseColorScheme,
  };
});

describe('Button component', () => {
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

  test('props `style` backgroundColor should apply correctly to the pressable component', () => {
    const style = { width: 200, height: 10, backgroundColor: 'red' };
    render(
      <Button
        label={label}
        style={style}
        variant="primary"
        testID="button_testId"
      />,
    );
    expect(screen.getByTestId('button_testId')).toHaveStyle(style);
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

  test('pressed style should apply correctly when the `button`is touch', () => {
    mockedUseColorScheme.mockReturnValue('light');
    render(
      <Button label={label} testOnly_pressed={true} testID="button_testId" />,
    );
    expect(screen.getByTestId('button_testId')).toHaveStyle({
      backgroundColor: colors.grey900,
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

  test('dark mode should apply correctly on each variant', () => {
    mockedUseColorScheme.mockReturnValue('dark');
    const { rerender } = render(
      <Button label={label} testID="button_testId" />,
    );
    expect(screen.getByTestId('button_testId')).toHaveStyle({
      backgroundColor: colors.white,
    });
    rerender(
      <Button label={label} testID="button_testId" variant="secondary" />,
    );
    expect(screen.getByTestId('button_testId')).toHaveStyle({
      backgroundColor: 'transparent',
    });
    rerender(<Button label={label} testID="button_testId" variant="cancel" />);
    expect(screen.getByTestId('button_testId')).toHaveStyle({
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
