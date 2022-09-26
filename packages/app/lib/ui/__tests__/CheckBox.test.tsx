import { fireEvent, render, screen } from '@testing-library/react-native';

import CheckBox from '../CheckBox';

const onChange = jest.fn();
describe('Checkbox component', () => {
  test('props `container` style should apply to the container wrapper', () => {
    const containerStyle = { backgroundColor: 'red', width: 200 };
    render(
      <CheckBox
        checked={true}
        onValueChange={onChange}
        size={40}
        containerStyle={containerStyle}
      />,
    );
    const wrapper = screen.getByTestId('azzapp__CheckBox__view-wrapper');
    expect(wrapper.props.style).toMatchObject([
      { alignItems: 'center', flexDirection: 'row' },
      containerStyle,
    ]);
  });
  test('callback `onChange` should not be call when disabled', () => {
    render(<CheckBox checked={false} onValueChange={onChange} disabled />);
    const wrapper = screen.getByTestId('azzapp__CheckBox__view-wrapper');
    fireEvent(wrapper, 'onPress');
    expect(onChange).not.toBeCalled();
  });
});

test('should call `onChange` callback when triggering `onPress` event', () => {
  render(<CheckBox checked={false} onValueChange={onChange} />);
  const wrapper = screen.getByTestId('azzapp__CheckBox__view-wrapper');
  fireEvent(wrapper, 'onPress');
  expect(onChange).toBeCalled();
});
