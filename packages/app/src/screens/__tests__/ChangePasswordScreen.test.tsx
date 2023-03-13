import { fireEvent, render, act, cleanup } from '#helpers/testHelpers';
import ChangePasswordScreen from '../ChangePasswordScreen';
import '@testing-library/jest-native/extend-expect';

describe('ChangePasswordScreen Screen', () => {
  const changePassword = jest.fn();
  beforeEach(() => {
    changePassword.mockReset();
  });

  test('button `Create new password` should be disabled if new password and old password are not enter', () => {
    const { queryAllByRole } = render(
      <ChangePasswordScreen changePassword={changePassword} />,
    );
    const buttonComponent = queryAllByRole('button')[1];
    expect(buttonComponent).toBeDisabled();
    cleanup();
  });

  test('should not call the `changePassword` callback and show error message when password does not match the requirement', () => {
    const { queryAllByRole, getByPlaceholderText, getByText } = render(
      <ChangePasswordScreen changePassword={changePassword} />,
    );
    const inputPwd = getByPlaceholderText('New password');
    const inputConfig = getByPlaceholderText('Confirm password');
    act(() => {
      fireEvent(inputPwd, 'onChangeText', 'unsufficient password');
    });
    act(() => {
      fireEvent(inputConfig, 'onChangeText', 'unsufficient password');
    });
    const buttonComponent = queryAllByRole('button')[1];
    act(() => {
      fireEvent(buttonComponent, 'onPress');
    });
    expect(changePassword).not.toHaveBeenCalled();

    const errorMessage = getByText(
      'Password should contain at least 8 characters with at least 1 number, 1 uppercase letter and 1 lowercase letter',
    );
    expect(errorMessage).toBeTruthy();
    cleanup();
  });

  test('should not call the `changePassword` callback and shows error message when password does not match the confirm password', () => {
    const { queryAllByRole, getByPlaceholderText, getByText } = render(
      <ChangePasswordScreen changePassword={changePassword} />,
    );
    const inputPwd = getByPlaceholderText('New password');
    const inputConfig = getByPlaceholderText('Confirm password');
    act(() => {
      fireEvent(inputPwd, 'onChangeText', 'AZErty123&');
    });
    act(() => {
      fireEvent(inputConfig, 'onChangeText', 'doest not match');
    });

    const buttonComponent = queryAllByRole('button')[1];
    act(() => {
      fireEvent(buttonComponent, 'onPress');
    });
    expect(changePassword).not.toHaveBeenCalled();

    const errorMessage = getByText("Password doesn't match");
    expect(errorMessage).toBeTruthy();
    cleanup();
  });

  test('should call the `changePassword` callback when form is valid', () => {
    const { queryAllByRole, getByPlaceholderText } = render(
      <ChangePasswordScreen changePassword={changePassword} />,
    );
    const inputPwd = getByPlaceholderText('New password');
    const inputConfig = getByPlaceholderText('Confirm password');
    act(() => {
      fireEvent(inputPwd, 'onChangeText', 'AZErty123&');
    });
    act(() => {
      fireEvent(inputConfig, 'onChangeText', 'AZErty123&');
    });

    const buttonComponent = queryAllByRole('button')[1];
    act(() => {
      fireEvent(buttonComponent, 'onPress');
    });
    expect(changePassword).toHaveBeenCalled();

    cleanup();
  });
});
