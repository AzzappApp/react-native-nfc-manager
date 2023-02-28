import '@testing-library/jest-native/extend-expect';
import { act, fireEvent, render } from '#utils/test-util';
import SecuredTextInput from '../SecuredTextInput';

describe('SecuredTextInput component', () => {
  test('password should be display if icon showpassword is pressed', () => {
    const { queryByTestId } = render(<SecuredTextInput value="test value" />);
    const input = queryByTestId('azzap_native_text_input');
    expect(input).toHaveProp('secureTextEntry', true);
    const iconView = queryByTestId('azzapp__Input__secure-icon');
    act(() => {
      fireEvent(iconView, 'onPress', { stopPropagation: jest.fn() });
    });
    expect(input).toHaveProp('secureTextEntry', false);
  });
});
