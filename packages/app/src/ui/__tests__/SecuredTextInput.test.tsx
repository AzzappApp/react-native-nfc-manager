import '@testing-library/jest-native/extend-expect';
import { act, fireEvent, render } from '#helpers/testHelpers';
import SecuredTextInput from '../SecuredTextInput';

describe('SecuredTextInput component', () => {
  test('password should be display if icon showpassword is pressed', () => {
    const { queryByTestId, getByTestId } = render(
      <SecuredTextInput value="test value" />,
    );
    const input = queryByTestId('azzap_native_text_input');
    expect(input).toHaveProp('secureTextEntry', true);
    const iconView = getByTestId('azzapp__Input__secure-icon');
    act(() => {
      fireEvent(iconView, 'onPress', { stopPropagation: jest.fn() });
    });
    expect(input).toHaveProp('secureTextEntry', false);
  });
});
