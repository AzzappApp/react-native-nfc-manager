import ERRORS from '@azzapp/shared/errors';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { init as initLocaleHelpers } from '#helpers/localeHelpers';
import { signin } from '#helpers/MobileWebAPI';
import {
  act,
  fireEvent,
  createMockRouter,
  render,
  screen,
} from '#helpers/testHelpers';
import SignInScreen from '../SignInScreen';

jest.mock('#helpers/MobileWebAPI');
jest.mock('#helpers/globalEvents');
jest.mock('react-native-keychain', () => ({
  setSharedWebCredentials: jest.fn().mockResolvedValue(true),
}));
jest.mock('#ui/SelectList');

const mockRouter = createMockRouter();
jest.mock('#components/NativeRouter', () => ({
  ...jest.requireActual('#components/NativeRouter'),
  useRouter: () => mockRouter,
}));

describe('Signin Screen', () => {
  const signinMock = jest.mocked(signin);
  const dispatchGlobalEventMock = jest.mocked(dispatchGlobalEvent);

  beforeAll(() => {
    initLocaleHelpers();
  });

  beforeEach(() => {
    signinMock.mockReset();
    dispatchGlobalEventMock.mockReset();
  });

  test('submit button should be enabled only if both credential or password are set', () => {
    render(<SignInScreen />);

    const credentialInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    expect(buttonComponent).toBeDisabled();
    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    expect(credentialInput.props.value).toBe('myname');

    expect(buttonComponent).toBeDisabled();
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));
    expect(passwordInput.props.value).toBe('myPassword');
    expect(buttonComponent).not.toBeDisabled();
  });

  test('should call the `signin` callback if credential and password are filled', async () => {
    render(<SignInScreen />);
    signinMock.mockResolvedValueOnce({
      token: 'fake-token',
      refreshToken: 'fake-refreshToken',
      userId: 'fake-userId',
      profileInfos: {
        profileId: 'fake-profileId',
        webCardId: 'fake-webCardId',
        profileRole: 'editor',
      },
      email: 'fake-email',
      phoneNumber: 'fake-phoneNumber',
    });

    const credentialInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    act(() => fireEvent(buttonComponent, 'onPress'));
    expect(signin).not.toHaveBeenCalled();

    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));

    act(() => fireEvent(buttonComponent, 'onPress'));
    expect(signin).not.toHaveBeenCalled();

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
        profileInfos: {
          profileId: 'fake-profileId',
          profileRole: 'editor',
          webCardId: 'fake-webCardId',
        },
        email: 'fake-email',
        phoneNumber: 'fake-phoneNumber',
        userId: 'fake-userId',
      },
    });
  });

  test('should display an error message if the credentials are invalid', async () => {
    render(<SignInScreen />);
    const credentialInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    act(() => fireEvent(credentialInput, 'onChangeText', '__'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));

    expect(
      screen.queryByText('Please use a valid phone number or email address'),
    ).not.toBeTruthy();

    act(() => fireEvent(buttonComponent, 'onPress'));
    expect(
      screen.queryByText('Please use a valid phone number or email address'),
    ).toBeTruthy();
    expect(signinMock).not.toHaveBeenCalled();
  });

  test('should display an error message if the `signin` callback fails', async () => {
    render(<SignInScreen />);
    signinMock.mockRejectedValueOnce(new Error(ERRORS.INVALID_CREDENTIALS));

    const credentialInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));

    expect(screen.queryByText('Invalid credentials')).not.toBeTruthy();

    act(() => fireEvent(buttonComponent, 'onPress'));
    await act(flushPromises);
    expect(screen.queryByText('Invalid credentials')).toBeTruthy();
  });

  test('should display an error message if the account has been disabled', async () => {
    render(<SignInScreen />);
    signinMock.mockRejectedValueOnce(new Error(ERRORS.FORBIDDEN));

    const credentialInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));

    expect(
      screen.queryByText(
        'Your account has been disabled. Please contact support.',
      ),
    ).not.toBeTruthy();

    act(() => fireEvent(buttonComponent, 'onPress'));
    await act(flushPromises);
    expect(
      screen.queryByText(
        'Your account has been disabled. Please contact support.',
      ),
    ).toBeTruthy();
  });

  test('should redirect the user if the user credential is not confirmed', async () => {
    render(<SignInScreen />);
    signinMock.mockResolvedValueOnce({
      token: 'fake-token',
      refreshToken: 'fake-refreshToken',
      userId: 'fake-userId',
      profileInfos: null,
      email: null,
      phoneNumber: null,
      issuer: 'fake.email@gmail.com',
    });

    const credentialInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const buttonComponent = screen.getByTestId('submitButton');

    act(() => fireEvent(credentialInput, 'onChangeText', 'myname'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'myPassword'));
    act(() => fireEvent(buttonComponent, 'onPress'));
    await act(flushPromises);
    expect(dispatchGlobalEvent).not.toHaveBeenCalled();

    expect(mockRouter.push).toHaveBeenCalledWith({
      route: 'CONFIRM_REGISTRATION',
      params: {
        issuer: 'fake.email@gmail.com',
      },
    });
  });
});
