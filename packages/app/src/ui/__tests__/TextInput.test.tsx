import '@testing-library/jest-native/extend-expect';
import { TextInput as NativeTextInput } from 'react-native';
import { colors } from '#theme';
import { render, screen } from '#helpers/testHelpers';
import TextInput from '../TextInput';

describe('TextInput component', () => {
  test('setting props `label` should render the Text component', () => {
    const label = 'label';
    render(<TextInput label={label} />);
    const labelElement = screen.getByText(label);
    expect(labelElement).not.toBeNull();
  });

  test('setting props `containerStyle` should apply correctly the the container wrapper', () => {
    const containerStyle = { backgroundColor: 'red', width: 200 };
    render(<TextInput containerStyle={containerStyle} />);
    const wrapper = screen.getByTestId('azzapp__Input__view-wrapper');
    expect(wrapper.props.style).toMatchObject([
      { padding: 10, paddingBottom: 0 },
      containerStyle,
    ]);
  });

  test('props `style` {width: 200} should apply correctly to the TextInput component', () => {
    const style = { width: 200 };
    render(<TextInput style={style} />);
    expect(screen.queryByTestId('azzap_native_text_input')).toHaveStyle(style);
  });

  test('props `placeholderTextColor` should apply correclty the the TextInput component', () => {
    const { queryByTestId, rerender } = render(<TextInput />);
    let wrapper = queryByTestId('azzapp__Input__view-wrapper');
    let inputTree = wrapper?.findByType(NativeTextInput);
    expect(inputTree?.props.placeholderTextColor).toBe(colors.grey400);
    rerender(<TextInput placeholderTextColor="pink" />);
    wrapper = queryByTestId('azzapp__Input__view-wrapper');
    inputTree = wrapper?.findByType(NativeTextInput);
    expect(inputTree?.props.placeholderTextColor).toBe('pink');
  });

  test('props `errorLabel` should apply correctly and the Text component should be present', () => {
    const { queryByTestId, rerender } = render(
      <TextInput errorLabel="azzapp2TheMoon" />,
    );
    let wrapper = queryByTestId('azzapp__Input__error-label');
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveTextContent('azzapp2TheMoon');
    rerender(<TextInput />);
    wrapper = queryByTestId('azzapp__Input__error-label');
    expect(wrapper).toBeNull();
  });

  test('using a destructured props(from TextInputProps) `editable` should apply correctly on the TextInput component', () => {
    const { queryByTestId } = render(<TextInput editable={false} />);
    const wrapper = queryByTestId('azzapp__Input__view-wrapper');
    const inputTree = wrapper?.findByType(NativeTextInput);
    expect(inputTree?.props.editable).toBe(false);
  });
});
