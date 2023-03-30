import '@testing-library/jest-native/extend-expect';
import { act, fireEvent, render } from '#helpers/testHelpers';
import SecuredTextInput from '../SecuredTextInput';

describe('SecuredTextInput component', () => {
  test('password should be display if icon showpassword is pressed', () => {
    const { queryByPlaceholderText, getByRole } = render(
      <SecuredTextInput value="test value" placeholder="Password" />,
    );
    const input = queryByPlaceholderText('Password');
    expect(input).toHaveProp('secureTextEntry', true);
    const iconView = getByRole('togglebutton');
    expect(input).toHaveAccessibilityState(
      expect.objectContaining({ checked: true }),
    );

    act(() => {
      fireEvent(iconView, 'onPress', { stopPropagation: jest.fn() });
    });
    expect(input).toHaveProp('secureTextEntry', false);
    expect(input).toHaveAccessibilityState(
      expect.objectContaining({ checked: true }),
    );
  });
});
