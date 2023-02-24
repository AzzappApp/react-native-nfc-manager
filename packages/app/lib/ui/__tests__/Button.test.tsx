import { act, fireEvent, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

import { colors } from '../../theme';
import Button from '../Button';
const label = 'label';
describe('Button component', () => {
  test('should render with the correct label', () => {
    render(<Button label={label} />);
    expect(
      screen.getByTestId('azzapp_Button_pressable-wrapper'),
    ).not.toBeNull();
    expect(screen.getByText(label)).not.toBeNull();
  });

  test('props `style` should apply correctly to the pressable component', () => {
    const style = { width: 200, height: 10 };
    render(<Button label={label} style={style} />);
    expect(screen.getByTestId('azzapp_Button_pressable-wrapper')).toHaveStyle(
      style,
    );
  });

  test('props `style` should apply correctly to the pressable component with `variant` secondary', () => {
    const style = { width: 200, height: 10 };
    render(<Button label={label} style={style} variant="secondary" />);
    expect(screen.getByTestId('azzapp_Button_pressable-wrapper')).toHaveStyle(
      style,
    );
  });

  test('props `style` backgroundColor should apply correctly to the pressable component', () => {
    const style = { width: 200, height: 10, backgroundColor: 'red' };
    render(<Button label={label} style={style} variant="primary" />);
    expect(screen.getByTestId('azzapp_Button_pressable-wrapper')).toHaveStyle(
      style,
    );
  });

  test('props `style` backgroundColor should not apply when button is disabled', () => {
    const style = { width: 200, height: 10, backgroundColor: 'red' };
    render(
      <Button
        label={label}
        style={style}
        variant="secondary"
        disabled={true}
      />,
    );
    expect(screen.getByTestId('azzapp_Button_pressable-wrapper')).toHaveStyle([
      style,
      { backgroundColor: '#C8C7CA' },
    ]);
  });

  test('pressed style should apply correctly when the `button`is touch', () => {
    render(<Button label={label} testOnly_pressed={true} />);
    expect(screen.getByTestId('azzapp_Button_pressable-wrapper')).toHaveStyle({
      backgroundColor: colors.grey900,
    });
  });

  test('should call `onPress` callback when onPress is fired on the pressable component', () => {
    const onPress = jest.fn();
    render(<Button label={label} onPress={onPress} />);
    act(() => {
      fireEvent(
        screen.getByTestId('azzapp_Button_pressable-wrapper'),
        'onPress',
      );
    });
    expect(onPress).toHaveBeenCalled();
  });

  test('should not call `onPress` callback when props `disabled` is true', () => {
    const onPress = jest.fn();
    render(<Button label={label} onPress={onPress} disabled={true} />);
    act(() => {
      fireEvent(
        screen.getByTestId('azzapp_Button_pressable-wrapper'),
        'onPress',
      );
    });
    expect(onPress).toHaveBeenCalledTimes(0);
  });
});
