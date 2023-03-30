import ERRORS from '@azzapp/shared/errors';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import SignInScreen from '../SignInScreen';
import '@testing-library/jest-native/extend-expect';

jest.useFakeTimers();
describe('Signin Screen', () => {
  const signin = jest.fn();
  beforeEach(() => {
    signin.mockReset();
  });

  test('submit button should be `disabled` if both credential and password are empty', () => {
    render(<SignInScreen signin={signin} />);

    const credentialInput = screen.getByPlaceholderText(
      'Phone number or email address',
    );
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    expect(buttonComponent).toBeDisabled();
    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    expect(credentialInput.props.value).toBe('myname');

    expect(buttonComponent).toBeDisabled();
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));
    expect(passwordInput.props.value).toBe('myPassword');
  });

  test('should call the `signin` callback if credential and password are filled', () => {
    render(<SignInScreen signin={signin} />);

    const credentialInput = screen.getByPlaceholderText(
      'Phone number or email address',
    );
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));
    act(() => fireEvent(buttonComponent, 'onPress'));

    expect(signin).toHaveBeenCalledWith({
      credential: 'myname',
      password: 'myPassword',
    });
  });

  test('should display an error message if the `signin` callback fails', () => {
    render(<SignInScreen signin={signin} />);
    signin.mockRejectedValueOnce(new Error(ERRORS.INVALID_CREDENTIALS));

    const credentialInput = screen.getByPlaceholderText(
      'Phone number or email address',
    );
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));

    expect(screen.queryByText('Invalid credentials')).not.toBeTruthy();

    act(() => fireEvent(buttonComponent, 'onPress'));
    act(() => jest.runAllTicks());
    expect(screen.queryByText('Invalid credentials')).toBeTruthy();
  });
});
