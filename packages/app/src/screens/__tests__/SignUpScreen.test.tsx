import ERRORS from '@azzapp/shared/errors';
import { act, fireEvent, render, screen } from '#helpers/testHelpers';
import SignUpScreen from '../SignUpScreen';
import '@testing-library/jest-native/extend-expect';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
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
}));

jest.useFakeTimers();
describe('SignUpScreen', () => {
  const signup = jest.fn();
  beforeEach(() => {
    signup.mockReset();
  });

  test('submit button should be disabled if fields are empty', () => {
    render(<SignUpScreen signup={signup} />);
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

  test('should call the `signup` callback if form is valid', () => {
    render(<SignUpScreen signup={signup} />);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    act(() => fireEvent(emailInput, 'onChangeText', 'test@azzaap.com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));

    expect(signup).toHaveBeenCalledWith({
      email: 'test@azzaap.com',
      password: 'AZEqsd81',
    });
  });

  test('should call the `signup` callback if form is filled with a valid phone number', () => {
    render(<SignUpScreen signup={signup} />);
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

    expect(signup).toHaveBeenCalledWith({
      phoneNumber: '+1 212 688 0188',
      password: 'AZEqsd81',
    });
  });

  test('should not call the `signup` callback if phone number is not valid', () => {
    render(<SignUpScreen signup={signup} />);
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
    expect(signup).not.toHaveBeenCalled();
    expect(
      screen.queryByText('Please enter a valid phone number'),
    ).toBeTruthy();
  });

  test('should not call the `signup` callback if email is not valid', () => {
    render(<SignUpScreen signup={signup} />);
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
    expect(signup).not.toHaveBeenCalled();
    expect(
      screen.queryByText('Please enter a valid email address'),
    ).toBeTruthy();
  });

  test('should not call the `signup` callback if password is not valid', () => {
    render(<SignUpScreen signup={signup} />);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    act(() => fireEvent(emailInput, 'onChangeText', 'test@azzapp.com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'wrongpassword'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));

    const passwordError =
      'Password should contain at least 8 characters, a number, an uppercase letter and a lowercase letter';
    expect(screen.queryByText(passwordError)).not.toBeTruthy();

    act(() => fireEvent(submitButton, 'onPress'));
    expect(signup).not.toHaveBeenCalled();
    expect(screen.queryByText(passwordError)).toBeTruthy();
  });

  test('should not call the `signup` callback if the checkbox are not checked', () => {
    render(<SignUpScreen signup={signup} />);
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
    expect(signup).not.toHaveBeenCalled();
    expect(screen.queryByText(tosError)).toBeTruthy();

    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));
    expect(signup).not.toHaveBeenCalled();
    expect(screen.queryByText(tosError)).toBeTruthy();

    act(() => fireEvent(checkboxes[1], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));

    expect(screen.queryByText(tosError)).not.toBeTruthy();
    expect(signup).toHaveBeenCalled();
  });

  test('should display the already registered error message if signup return the error', () => {
    render(<SignUpScreen signup={signup} />);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    signup.mockRejectedValueOnce(new Error(ERRORS.EMAIL_ALREADY_EXISTS));

    act(() => fireEvent(emailInput, 'onChangeText', 'test@azzaap.com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));

    const emailAlreadyExistError = 'This email address is already registered';
    expect(screen.queryByText(emailAlreadyExistError)).not.toBeTruthy();

    act(() => {
      jest.runAllTicks();
    });
    expect(screen.queryByText(emailAlreadyExistError)).toBeTruthy();
  });

  test('should display unknown error in case of unknown error ;)', () => {
    render(<SignUpScreen signup={signup} />);
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByTestId('submit');
    const checkboxes = screen.queryAllByRole('checkbox');

    signup.mockRejectedValueOnce(new Error("I don't know what happened"));

    act(() => fireEvent(emailInput, 'onChangeText', 'test@azzaap.com'));
    act(() => fireEvent(passwordInput, 'onChangeText', 'AZEqsd81'));
    act(() => fireEvent(checkboxes[0], 'onPress'));
    act(() => fireEvent(checkboxes[1], 'onPress'));
    act(() => fireEvent(submitButton, 'onPress'));

    const unknownError = 'Unknown error - Please retry';
    expect(screen.queryByText(unknownError)).not.toBeTruthy();

    act(() => {
      jest.runAllTicks();
    });
    expect(screen.queryByText(unknownError)).toBeTruthy();
  });
});
