import ERRORS from '@azzapp/shared/errors';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { signin } from '#helpers/MobileWebAPI';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import SignInScreen from '../SignInScreen';

jest.mock('#helpers/MobileWebAPI');
jest.mock('#helpers/globalEvents');

describe('Signin Screen', () => {
  const signinMock = jest.mocked(signin);
  const dispatchGlobalEventMock = jest.mocked(dispatchGlobalEvent);

  beforeEach(() => {
    signinMock.mockReset();
    dispatchGlobalEventMock.mockReset();
  });

  // TODO reenable this test
  xtest('submit button should be `disabled` if both credential and password are empty', () => {
    render(<SignInScreen />);

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
    console.log(passwordInput);
    console.log(passwordInput.props.value);
    expect(passwordInput.props.value).toBe('myPassword');
  });

  test('should call the `signin` callback if credential and password are filled', async () => {
    render(<SignInScreen />);
    signinMock.mockResolvedValueOnce({
      token: 'fake-token',
      refreshToken: 'fake-refreshToken',
      webCardId: 'fake-webCardId',
    });

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

    expect(buttonComponent).toHaveAccessibilityState({ busy: true });
    await act(flushPromises);
    expect(dispatchGlobalEventMock).toHaveBeenCalledWith({
      type: 'SIGN_IN',
      payload: {
        authTokens: {
          token: 'fake-token',
          refreshToken: 'fake-refreshToken',
        },
        webCardId: 'fake-webCardId',
      },
    });
  });

  test('should display an error message if the `signin` callback fails', async () => {
    render(<SignInScreen />);
    signinMock.mockRejectedValueOnce(new Error(ERRORS.INVALID_CREDENTIALS));

    const credentialInput = screen.getByPlaceholderText(
      'Phone number or email address',
    );
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));

    expect(screen.queryByText('Invalid credentials')).not.toBeTruthy();

    act(() => fireEvent(buttonComponent, 'onPress'));
    await act(flushPromises);
    expect(screen.queryByText('Invalid credentials')).toBeTruthy();
  });
});
