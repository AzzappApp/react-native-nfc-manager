import ERRORS from '@azzapp/shared/errors';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { signup } from '#helpers/MobileWebAPI';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import SignUpScreen from '../SignUpScreen';

jest.mock('#helpers/localeHelpers', () => ({
  getLocales: () => [
    {
      countryCode: 'US',
      languageTag: 'en-US',
      languageCode: 'en',
      isRTL: false,
      uniqueId: 'en-US',
    },
  ],
  useCurrentLocale: () => 'en',
  getCurrentLocale: () => 'en',
}));

jest.mock('#helpers/MobileWebAPI');
jest.mock('#helpers/globalEvents');
jest.mock('#ui/SelectList');

describe('SignUpScreen', () => {
  const signupMock = jest.mocked(signup);
  const dispatchGlobalEventMock = jest.mocked(dispatchGlobalEvent);
  beforeEach(() => {
    signupMock.mockReset();
    dispatchGlobalEventMock.mockReset();
  });

  test('submit button should be enabled only if all field are set', () => {
    render(<SignUpScreen />);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    expect(submitButton).toBeDisabled();

    act(() => fireEvent(emailInput, 'onChangeText', ''));
    act(() => fireEvent(passwordInput, 'onChangeText', ''));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));

    expect(submitButton).toBeDisabled();
    act(() => fireEvent(emailInput, 'onChangeText', 'a'));

    expect(submitButton).toBeDisabled();
    act(() => fireEvent(passwordInput, 'onChangeText', 'b'));

    expect(submitButton).not.toBeDisabled();
  });

  test('should call the `signup` callback if form is valid', async () => {
    render(<SignUpScreen />);
    signupMock.mockResolvedValueOnce({
      token: 'fake-token',
      refreshToken: 'fake-refreshToken',
      profileInfos: null,
      userId: '',
      email: 'test@azzapp.com',
      phoneNumber: null,
    });
    dispatchGlobalEventMock.mockResolvedValueOnce(void 0);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    act(() => fireEvent(emailInput, 'onChangeText', 'test@azzaap.com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));

    expect(signupMock).toHaveBeenCalledWith({
      email: 'test@azzaap.com',
      password: 'AZEqsd81',
      locale: 'en-US',
    });
    expect(submitButton).toHaveAccessibilityState({ busy: true });

    await act(flushPromises);
  });

  // TODO : we mock select list to avoid update outside of act but it breaks this test
  xtest('should call the `signup` callback if form is filled with a valid phone number', async () => {
    render(<SignUpScreen />);
    signupMock.mockResolvedValueOnce({
      token: 'fake-token',
      refreshToken: 'fake-refreshToken',
      profileInfos: null,
      userId: '',
      email: null,
      phoneNumber: '+1 212 688 0188',
    });

    const emailOrCountryButton = screen.getByLabelText(
      'Select a calling code or email',
    );
    act(() => fireEvent(emailOrCountryButton, 'onPress'));
    let usaNumber = screen.getByText('United States of America');
    while (usaNumber && !usaNumber.props.onPress) {
      usaNumber = usaNumber.parent!;
    }
    act(() => fireEvent(usaNumber, 'onPress'));

    const phoneInput = screen.getByPlaceholderText('Phone number');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    act(() => fireEvent(phoneInput, 'onChangeText', '2126880188'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));

    expect(signupMock).toHaveBeenCalledWith({
      phoneNumber: '+1 212 688 0188',
      password: 'AZEqsd81',
      locale: 'en-US',
    });

    expect(submitButton).toHaveAccessibilityState({ busy: true });
    await act(flushPromises);
  });

  // TODO : we mock select list to avoid update outside of act but it breaks this test
  xtest('should not call the `signup` callback if phone number is not valid', () => {
    render(<SignUpScreen />);

    const emailOrCountryButton = screen.getByLabelText(
      'Select a calling code or email',
    );
    act(() => fireEvent(emailOrCountryButton, 'onPress'));
    let usaNumber = screen.getByText('United States of America');
    while (usaNumber && !usaNumber.props.onPress) {
      usaNumber = usaNumber.parent!;
    }
    act(() => fireEvent(usaNumber, 'onPress'));

    const phoneInput = screen.getByPlaceholderText('Phone number');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    act(() => fireEvent(phoneInput, 'onChangeText', '212'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));
    expect(
      screen.queryByText('Please enter a valid phone number'),
    ).not.toBeTruthy();

    act(() => fireEvent(submitButton, 'onPress'));
    expect(signupMock).not.toHaveBeenCalled();
    expect(
      screen.queryByText('Please enter a valid phone number'),
    ).toBeTruthy();
  });

  test('should not call the `signup` callback if email is not valid', () => {
    render(<SignUpScreen />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    act(() => fireEvent(emailInput, 'onChangeText', 'test@com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));

    expect(
      screen.queryByText('Please enter a valid email address'),
    ).not.toBeTruthy();

    act(() => fireEvent(submitButton, 'onPress'));
    expect(signupMock).not.toHaveBeenCalled();
    expect(
      screen.queryByText('Please enter a valid email address'),
    ).toBeTruthy();
  });

  test('should not call the `signup` callback if password is not valid', () => {
    render(<SignUpScreen />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    act(() => fireEvent(emailInput, 'onChangeText', 'test@azzapp.com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'wrongpassword'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));

    const passwordError =
      'Password should contain at least 8 characters and at most 32 characters, a number, an uppercase letter and a lowercase letter';
    expect(screen.queryByText(passwordError)).not.toBeTruthy();

    act(() => fireEvent(submitButton, 'onPress'));
    expect(signupMock).not.toHaveBeenCalled();
    expect(screen.queryByText(passwordError)).toBeTruthy();
  });

  test('should not call the `signup` callback if the checkbox are not checked', async () => {
    render(<SignUpScreen />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');
    const tosError =
      'You need to accept the Terms of Service and the Privacy Policy';

    act(() => fireEvent(emailInput, 'onChangeText', 'test@azzaap.com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));

    expect(screen.queryByText(tosError)).not.toBeTruthy();

    act(() => fireEvent(submitButton, 'onPress'));
    expect(signupMock).not.toHaveBeenCalled();
    expect(screen.queryByText(tosError)).toBeTruthy();

    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));
    await act(flushPromises);
    expect(signupMock).not.toHaveBeenCalled();
    expect(screen.queryByText(tosError)).toBeTruthy();

    act(() => fireEvent(checkboxes[1], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));
    await act(flushPromises);

    expect(screen.queryByText(tosError)).not.toBeTruthy();
    expect(signupMock).toHaveBeenCalled();
  });

  test('should display the already registered error message if signup return the error', async () => {
    render(<SignUpScreen />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    signupMock.mockRejectedValueOnce(new Error(ERRORS.EMAIL_ALREADY_EXISTS));

    act(() => fireEvent(emailInput, 'onChangeText', 'test@azzaap.com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));

    const emailAlreadyExistError = 'Unknown error - Please retry';
    expect(screen.queryByText(emailAlreadyExistError)).not.toBeTruthy();

    await act(flushPromises);
    expect(screen.queryByText(emailAlreadyExistError)).toBeTruthy();
  });

  test('should display unknown error in case of unknown error ;)', async () => {
    render(<SignUpScreen />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    signupMock.mockRejectedValueOnce(new Error("I don't know what happened"));

    act(() => fireEvent(emailInput, 'onChangeText', 'test@azzaap.com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));

    const unknownError = 'Unknown error - Please retry';
    expect(screen.queryByText(unknownError)).not.toBeTruthy();
    await act(flushPromises);

    expect(screen.queryByText(unknownError)).toBeTruthy();
  });

  test('should display an error message if the account has been disabled', async () => {
    render(<SignUpScreen />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    signupMock.mockRejectedValueOnce(new Error(ERRORS.FORBIDDEN));

    act(() => fireEvent(emailInput, 'onChangeText', 'test@azzaap.com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));

    const unknownError =
      'Your account has been disabled. Please contact support.';
    expect(screen.queryByText(unknownError)).not.toBeTruthy();
    await act(flushPromises);

    expect(screen.queryByText(unknownError)).toBeTruthy();
  });
});
