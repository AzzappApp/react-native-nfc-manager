import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import CheckBox from '../CheckBox';

const onChange = jest.fn();
describe('Checkbox component', () => {
  test('props `style` should apply to the container wrapper', () => {
    const containerStyle = { backgroundColor: 'red', width: 200 };
    render(
      <CheckBox
        status="checked"
        onValueChange={onChange}
        style={containerStyle}
      />,
    );
    const wrapper = screen.getByRole('checkbox');
    expect(StyleSheet.flatten(wrapper.props.style)).toMatchObject(
      StyleSheet.flatten([
        { alignItems: 'center', flexDirection: 'row' },
        containerStyle,
      ]),
    );
  });

  test('callback `onChange` should not be call when disabled', () => {
    render(<CheckBox status="none" onValueChange={onChange} disabled />);
    const wrapper = screen.getByRole('checkbox');
    fireEvent(wrapper, 'onPress');
    expect(onChange).not.toBeCalled();
  });

  test('should call `onChange` callback when triggering `onPress` event', () => {
    render(<CheckBox status="none" onValueChange={onChange} />);
    const wrapper = screen.getByRole('checkbox');
    fireEvent(wrapper, 'onPress');
    expect(onChange).toBeCalled();
  });
});
