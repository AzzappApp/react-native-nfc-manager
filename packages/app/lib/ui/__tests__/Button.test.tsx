import { act, fireEvent, render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

import { colors } from '../../../theme';
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
});
